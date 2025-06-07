// Share types
export type ShareType = 'common' | 'preferred' | 'option';

// SAFE types
export type SafeType = 'pre-money' | 'post-money';

export interface Founder {
  name: string;
  ownership: number;
}

export interface Pool {
  note: string;
  ownership: number;
}

export interface CompanyConfig {
  founders?: Founder[];
  pools?: Pool[];
}

export interface CapTableEntry {
  name: string;
  shares: number;
  type: ShareType;
}

export interface Safe {
  cap: number | 'uncapped';
  amount: number;
  name: string;
  converted: boolean;
  discount?: number; // Discount rate (0-100%)
  type: SafeType;
}

// Define a snapshot of equity at a point in time
export interface EquitySnapshot {
  label: string;
  entries: {
    name: string;
    shares: number;
    type: ShareType;
    percentage: number;
  }[];
  totalShares: number;
}