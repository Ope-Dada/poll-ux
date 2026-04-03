import type { Politician, VoteDirection } from '../types.js';
import { getC, getUV } from '../lib/storage.js';
import { fmt, pct, ini, tagClass } from '../lib/helpers.js';
import { castVote } from '../api/votes.js';
import { POLS } from '../data/politicians.js';
import { showToast } from '../ui/toast.js';

export function card(pol: Politician): string {
    const c = getC(), uv = getUV();
    const cv = c[pol.id] || { s: 0, o: 0 };
    const { sp, op } = pct(cv.s, cv.o);
    const voted = uv[pol.id], total = cv.s + cv.o;
    const barW = total === 0 ? 0 : sp;

    void op;

    return `<div class="pcard" id="pc-${pol.id}">
    <div class="pcard-hd">
      <div class="av" style="background:${pol.color}">${ini(pol.name)}</div>
      <div class="pcard-info">
        <div class="pcard-name" title="${pol.name}">${pol.name}</div>
        <div class="pcard-tags">
          <span class="tag ${tagClass(pol.party)}">${pol.party}</span>
          <span class="tag type">${pol.type}</span>
        </div>
        <div class="pcard-role">${pol.role} · ${pol.state}</div>
      </div>
    </div>
    <p class="pcard-bio">${pol.bio}</p>
    <div class="vbar-wrap">
      <div class="vbar-track"><div class="vbar-fill" style="width:${barW}%"></div></div>
      <div class="vnums">
        <span class="vn-s">${total === 0 ? 'No votes yet' : fmt(cv.s) + ' support' + (total > 0 ? ' · ' + sp + '%' : '')}</span>
        <span class="vn-o">${total > 0 ? fmt(cv.o) + ' oppose' : ''}</span>
      </div>
    </div>
    <div class="vbtns">
      <button class="vbtn ${voted === 's' ? 'vs' : ''}" onclick="doVote('${pol.id}','s',event)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
        ${voted === 's' ? 'Supported ✓' : 'Support'}
      </button>
      <button class="vbtn ${voted === 'o' ? 'vo' : ''}" onclick="doVote('${pol.id}','o',event)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
        ${voted === 'o' ? 'Opposed ✓' : 'Oppose'}
      </button>
    </div>
    <button class="ai-btn" onclick="aiInfo('${pol.id}',event)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 16v-4M12 8h.01"/></svg>
      Ask AI about ${pol.name.split(' ')[0]}
    </button>
  </div>`;
}

export function doVote(pid: string, t: VoteDirection, e: Event): void {
    e.stopPropagation();
    const el = document.getElementById('pc-' + pid);
    if (el) { el.classList.add('blip'); setTimeout(() => el.classList.remove('blip'), 200) }
    castVote(pid, t);
}

export function aiInfo(pid: string, e: Event): void {
    e.stopPropagation();
    const pol = POLS.find(p => p.id === pid); if (!pol) return;
    const prompt = `Give me a current, factual briefing on Nigerian politician ${pol.name} (${pol.role}, ${pol.party}). Include:
1. Their current role and status as of today
2. Most recent major news or political activity (last 3-6 months)
3. Biggest political achievement or legacy
4. Current controversies or challenges they face
5. Their public approval perception in Nigeria right now
6. What they are likely to do politically in the next 12 months
Be concise, factual, and neutral.`;
    const copy = (txt: string) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(txt).then(() => showToast('Prompt copied — paste into Claude.ai 🤖', '#a78bfa')).catch(() => fbCopy(txt));
        } else fbCopy(txt);
    };
    copy(prompt);
}

export function fbCopy(txt: string): void {
    const el = document.createElement('textarea'); el.value = txt;
    el.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(el);
    el.focus(); el.select();
    try { document.execCommand('copy'); showToast('Copied! Paste into Claude.ai 🤖', '#a78bfa') }
    catch (err) { showToast('Could not copy — try again', '#ef4444') }
    document.body.removeChild(el);
}