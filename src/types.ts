export type Zone = 'Southwest' | 'Southeast' | 'South-South' | 'Northwest' | 'Northeast' | 'North Central';
export type Party = 'APC' | 'PDP' | 'Labour' | 'NNPP' | 'APGA' | 'Independent' | 'ADC';
export type PoliticianType = 'National' | 'Governor' | 'Senator';
export type VoteDirection = 's' | 'o';
export type PageId = 'home' | 'polls' | 'lb' | 'rg' | 'about' | 'verdict';
export type SortMode = 'trending' | 'supported' | 'opposed' | 'polarising' | 'alpha';
export type LeaderboardMode = 'support' | 'oppose' | 'votes';

export interface Politician {
  id: string;
  name: string;
  abbr: string;
  party: Party;
  type: PoliticianType;
  role: string;
  state: string;
  region: Zone;
  color: string;
  bio: string;
  seeds: { s: number; o: number };
}

export interface VoteCounts {
  s: number;
  o: number;
}

export interface CountStore {
  [id: string]: VoteCounts;
}

export interface UserVoteStore {
  [id: string]: VoteDirection;
}

export interface Comment {
  id: string;
  voter: string;
  text: string;
  sentiment: VoteDirection | 'neutral';
  ts: number;
}

export interface CommentStore {
  [id: string]: Comment[];
}

export interface PctResult {
  sp: number;
  op: number;
}

export interface ZoneDefinition {
  name: Zone;
  states: string;
  pols: string[];
}

export type RegionalBiasMap = {
  [politicianId: string]: Partial<Record<Zone, number>>;
};

