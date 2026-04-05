import type { VoteDirection } from '../types.js';
import { db } from '../lib/supabase.js';
import { getC, saveC, getUV, saveUV, getUID, getLV, saveLV } from '../lib/storage.js';
import { showToast } from '../ui/toast.js';
import { refresh } from '../ui/nav.js';

export async function loadFromSupabase(): Promise<void> {
    try {
        // Read aggregated counts from poll_votes
        const { data: votes, error: ve } = await db.from('poll_votes').select('*');
        if (!ve && votes) {
            const c = getC();
            votes.forEach((row: { politician_id: string; support_count: number; oppose_count: number }) => {
                c[row.politician_id] = { s: row.support_count || 0, o: row.oppose_count || 0 };
            });
            saveC(c);
        }

        // Load this device's own votes
        const { data: uVotes, error: uve } = await db
            .from('poll_user_votes').select('*').eq('user_id', getUID());
        if (!uve && uVotes) {
            const uv: Record<string, VoteDirection> = {};
            uVotes.forEach((row: { politician_id: string; direction: VoteDirection }) => {
                uv[row.politician_id] = row.direction;
            });
            saveUV(uv);
        }

        // Get last vote timestamp per politician from recent activity
        const { data: recentVotes } = await db
            .from('poll_user_votes')
            .select('politician_id, created_at')
            .order('created_at', { ascending: false })
            .limit(500);

        if (recentVotes) {
            const lv: Record<string, number> = {};
            recentVotes.forEach((row: { politician_id: string; created_at: string }) => {
                if (!lv[row.politician_id]) {
                    lv[row.politician_id] = new Date(row.created_at).getTime();
                }
            });
            saveLV(lv);
        }

        refresh();
    } catch (err) {
        console.warn('Could not load from Supabase — showing local data:', err);
        refresh();
    }
}

export async function castVote(pid: string, type: VoteDirection): Promise<void> {
    const c = getC(), uv = getUV(), prev = uv[pid];
    if (!c[pid]) c[pid] = { s: 0, o: 0 };

    const removing = prev === type;
    if (removing) {
        c[pid][type] = Math.max(0, c[pid][type] - 1);
        delete uv[pid];
        showToast('Vote removed', '#666');
    } else {
        if (prev) c[pid][prev] = Math.max(0, c[pid][prev] - 1);
        c[pid][type]++;
        uv[pid] = type;
        // Save last voted timestamp immediately on this device
        const lv = getLV();
        lv[pid] = Date.now();
        saveLV(lv);
        showToast(type === 's' ? 'Support recorded 👍' : 'Opposition recorded 👎', type === 's' ? '#84cc16' : '#ef4444');
    }
    saveC(c); saveUV(uv); refresh();

    try {
        const uid = getUID();
        if (removing) {
            await db.from('poll_user_votes')
                .delete()
                .eq('user_id', uid)
                .eq('politician_id', pid);
        } else {
            await db.from('poll_user_votes').upsert(
                { user_id: uid, politician_id: pid, direction: type },
                { onConflict: 'user_id,politician_id' }
            );
        }
        await loadFromSupabase();
    } catch (err) {
        console.warn('Vote saved locally but cloud sync failed:', err);
    }
}