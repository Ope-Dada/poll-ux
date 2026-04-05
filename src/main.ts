import './styles/main.scss';

import { RENDERERS } from './ui/nav.js';
import { rHome } from './pages/home.js';
import { rPolls, setF, showSkeletons } from './pages/polls.js';
import { rLb, setLb } from './pages/leaderboard.js';
import { rRg } from './pages/regions.js';
import { rVerdict } from './pages/verdict.js';

RENDERERS.home = rHome;
RENDERERS.polls = rPolls;
RENDERERS.lb = rLb;
RENDERERS.rg = rRg;
RENDERERS.verdict = rVerdict;

import { doVote, aiInfo, shareCard } from './ui/card.js';
import { go, toggleMnav, closeMnav } from './ui/nav.js';

window.doVote = doVote;
window.aiInfo = aiInfo;
window.shareCard = shareCard;
window.go = go;
window.setF = setF;
window.setLb = setLb;
(window as any).rPolls = rPolls;
window.toggleMnav = toggleMnav;
window.closeMnav = closeMnav;

// Mobile filter drawer
window.openFilterDrawer = function () {
    document.getElementById('filter-drawer')?.classList.add('open');
    document.getElementById('filter-overlay')?.classList.add('open');
};
window.closeFilterDrawer = function () {
    document.getElementById('filter-drawer')?.classList.remove('open');
    document.getElementById('filter-overlay')?.classList.remove('open');
};

import { getC } from './lib/storage.js';
import { loadFromSupabase } from './api/votes.js';
import { subscribeRealtime } from './api/realtime.js';

const urlPol = new URLSearchParams(location.search).get('pol');

document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
        closeMnav();
        window.closeFilterDrawer();
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    getC();

    if (urlPol) {
        go('polls');
        showSkeletons(6);
    } else {
        rHome();
        showSkeletons(6);
    }

    await loadFromSupabase();
    subscribeRealtime();
});