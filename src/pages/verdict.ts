import { getC } from '../lib/storage.js';
import { fmt, pct, ini, tagClass, timeAgo } from '../lib/helpers.js';
import { POLS } from '../data/politicians.js';

// ── SNAPSHOT STORAGE ───────────────────────────────────────────
const KEYS = {
    day:   { snap: 'pollux_vd_snap', ts: 'pollux_vd_ts' },
    week:  { snap: 'pollux_vw_snap', ts: 'pollux_vw_ts' },
    month: { snap: 'pollux_vm_snap', ts: 'pollux_vm_ts' },
};

function getSnap(key: string): Record<string, { s: number; o: number }> {
    try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; }
}

function periodStart(period: 'day' | 'week' | 'month'): number {
    const d = new Date();
    if (period === 'day') {
        d.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
        const day = d.getDay();
        d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
        d.setHours(0, 0, 0, 0);
    } else {
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
    }
    return d.getTime();
}

function ensureSnapshot(period: 'day' | 'week' | 'month', c: Record<string, { s: number; o: number }>): boolean {
    const { snap, ts } = KEYS[period];
    const storedTs = parseInt(localStorage.getItem(ts) || '0', 10);
    const start = periodStart(period);
    // If no snapshot or snapshot is from before this period started → take fresh snapshot
    if (!storedTs || storedTs < start) {
        localStorage.setItem(snap, JSON.stringify(c));
        localStorage.setItem(ts, String(Date.now()));
        return true; // freshly initialised — no delta yet
    }
    return false;
}

// ── MOVERS ─────────────────────────────────────────────────────
interface Mover {
    pol: typeof POLS[0];
    newVotes: number;
    newSupport: number;
    newOppose: number;
    currentSp: number;
    currentTotal: number;
}

function getMovers(period: 'day' | 'week' | 'month', c: Record<string, { s: number; o: number }>, limit = 5): Mover[] {
    const snap = getSnap(KEYS[period].snap);
    return POLS.map(pol => {
        const cur = c[pol.id] || { s: 0, o: 0 };
        const prev = snap[pol.id] || { s: 0, o: 0 };
        const newSupport = Math.max(0, cur.s - prev.s);
        const newOppose  = Math.max(0, cur.o - prev.o);
        const newVotes   = newSupport + newOppose;
        const { sp } = pct(cur.s, cur.o);
        return { pol, newVotes, newSupport, newOppose, currentSp: sp, currentTotal: cur.s + cur.o };
    })
    .filter(x => x.newVotes > 0)
    .sort((a, b) => b.newVotes - a.newVotes)
    .slice(0, limit);
}

// ── RENDER HELPERS ─────────────────────────────────────────────
function periodLabel(period: 'day' | 'week' | 'month'): string {
    const start = periodStart(period);
    if (period === 'day') return 'Today';
    if (period === 'week') {
        const d = new Date(start);
        return `Since ${d.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'short' })}`;
    }
    const d = new Date(start);
    return d.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' });
}

function snapshotAge(period: 'day' | 'week' | 'month'): string {
    const ts = parseInt(localStorage.getItem(KEYS[period].ts) || '0', 10);
    return ts ? 'Tracking since ' + timeAgo(ts) : '';
}

function renderMoverRow(m: Mover, rank: number): string {
   
    const rankCls = rank === 1 ? 'vd-rank-g' : rank === 2 ? 'vd-rank-s' : rank === 3 ? 'vd-rank-b' : 'vd-rank-n';
    return `
    <div class="vd-row">
      <div class="vd-rank ${rankCls}">${rank}</div>
      <div class="vd-av" style="background:${m.pol.color}">${ini(m.pol.name)}</div>
      <div class="vd-info">
        <div class="vd-name">${m.pol.name}</div>
        <div class="vd-meta">
          <span class="tag ${tagClass(m.pol.party)}">${m.pol.party}</span>
          <span style="font-size:11px;color:var(--mu2)">${m.pol.state}</span>
        </div>
      </div>
      <div class="vd-stats">
        <div class="vd-new-votes">+${fmt(m.newVotes)} votes</div>
        <div class="vd-breakdown">
          <span class="vd-sup">↑${fmt(m.newSupport)}</span>
          <span class="vd-opp">↓${fmt(m.newOppose)}</span>
          <span class="vd-approval" style="color:${m.currentSp >= 50 ? 'var(--lime)' : 'var(--red)'}">${m.currentTotal > 0 ? m.currentSp + '% approval' : ''}</span>
        </div>
      </div>
    </div>`;
}

function renderSection(period: 'day' | 'week' | 'month', movers: Mover[], fresh: boolean, icon: string, title: string): string {
    const label = periodLabel(period);
    const age = snapshotAge(period);

    const body = fresh || movers.length === 0
        ? `<div class="vd-empty">
            <p>${fresh ? 'Tracking started — check back in a bit to see movement.' : 'No new votes recorded yet for this period.'}</p>
           </div>`
        : `<div class="vd-rows">${movers.map((m, i) => renderMoverRow(m, i + 1)).join('')}</div>`;

    return `
    <div class="vd-section">
      <div class="vd-sec-hd">
        <div>
          <div class="vd-sec-icon">${icon}</div>
          <div class="vd-sec-title">${title}</div>
          <div class="vd-sec-sub">${label}${age ? ' · ' + age : ''}</div>
        </div>
      </div>
      ${body}
    </div>`;
}

// ── MAIN RENDERER ──────────────────────────────────────────────
export function rVerdict(): void {
    const el = document.getElementById('vd-body');
    if (!el) return;

    const c = getC();

    // Ensure snapshots exist for each period
    const dayFresh   = ensureSnapshot('day',   c);
    const weekFresh  = ensureSnapshot('week',  c);
    const monthFresh = ensureSnapshot('month', c);

    const dayMovers   = getMovers('day',   c, 5);
    const weekMovers  = getMovers('week',  c, 5);
    const monthMovers = getMovers('month', c, 10);

    // Total votes across all politicians this period
    const totalToday = dayMovers.reduce((a, m) => a + m.newVotes, 0);
    const totalWeek  = weekMovers.reduce((a, m) => a + m.newVotes, 0);

    el.innerHTML = `
    <div class="vd-pulse-row">
      <div class="vd-pulse-stat">
        <div class="vd-pulse-n">${fmt(totalToday)}</div>
        <div class="vd-pulse-l">Votes today</div>
      </div>
      <div class="vd-pulse-stat">
        <div class="vd-pulse-n">${fmt(totalWeek)}</div>
        <div class="vd-pulse-l">Votes this week</div>
      </div>
      <div class="vd-pulse-stat">
        <div class="vd-pulse-n">${POLS.length}</div>
        <div class="vd-pulse-l">Politicians tracked</div>
      </div>
    </div>

    ${renderSection('day',   dayMovers,   dayFresh,   '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>', "Today\'s Most Active")}
    ${renderSection('week',  weekMovers,  weekFresh,  '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>', "This Week\'s Top Movers")}
    ${renderSection('month', monthMovers, monthFresh, '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>', "This Month\'s Leaders")}

    <p class="vd-note">Verdict tracks vote activity since your first visit each period. Data updates in real time as votes are cast across all devices.</p>
    `;
}