export {};

declare global {
    interface Window {
        doVote: (...args: any[]) => any;
        aiInfo: (...args: any[]) => any;
        shareCard: (...args: any[]) => any;
        go: (...args: any[]) => any;
        setF: (...args: any[]) => any;
        setLb: (...args: any[]) => any;
        rPolls: (...args: any[]) => any;
        toggleMnav: (...args: any[]) => any;
        closeMnav: (...args: any[]) => any;
        openFilterDrawer: (...args: any[]) => any;
        closeFilterDrawer: (...args: any[]) => any;
    }
}