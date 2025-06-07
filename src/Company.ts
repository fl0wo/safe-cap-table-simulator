// Define types for the Company class
import {EquitySnapshot, ShareType, Safe, CapTableEntry, CompanyConfig, SafeType} from './types.js';
import { plotEquityDilution } from './visualization.js';

export class Company {
    private shareCounter: number;
    private capTable: CapTableEntry[];
    private totalShares: number;
    private safes: Safe[];
    private history: EquitySnapshot[] = [];

    constructor({ founders = [], pools = [] }: CompanyConfig, initialShareCount: number = 1_000_000) {
        // Initialize cap table with founders and option pools
        this.shareCounter = 0;
        this.capTable = [];
        // Total shares issued
        this.totalShares = 0;
        // Use an initial share count to map percentages to absolute shares
        const base = initialShareCount;
        // Add founders
        founders.forEach(f => {
            const shares = Math.round((f.ownership / 100) * base);
            this._addEntity(f.name, shares, 'common');
        });
        // Add option pools
        pools.forEach(p => {
            const shares = Math.round((p.ownership / 100) * base);
            this._addEntity(p.note, shares, 'option');
        });
        this.safes = []; // track SAFEs
        
        // Add initial state to history
        this._saveSnapshot('Initial Cap Table');
    }

    private _addEntity(name: string, shares: number, type: ShareType = 'common'): void {
        this.capTable.push({ name, shares, type });
        this.totalShares += shares;
    }

    /**
     * Save current state of cap table to history
     */
    private _saveSnapshot(label: string): void {
        const snapshot: EquitySnapshot = {
            label,
            entries: this.capTable.map(entry => ({
                name: entry.name,
                shares: entry.shares,
                type: entry.type,
                percentage: (entry.shares / this.totalShares) * 100
            })),
            totalShares: this.totalShares
        };
        this.history.push(snapshot);
    }

    /**
     * Give equity to a new stakeholder
     * @param percent Percentage ownership post-issuance
     * @param name Name of entity receiving equity
     * @param type Type of shares (defaults to common)
     */
    public giveEquity(percent: number, name: string, type: ShareType = 'common'): Company {
        // Issue shares equal to percent of post-issuance total
        // newShares / (this.totalShares + newShares) = percent/100
        const newShares = Math.round(
            (percent / (100 - percent)) * this.totalShares
        );
        this._addEntity(name, newShares, type);
        this._saveSnapshot(`Equity Grant: ${name} (${percent}%)`);
        return this;
    }

    /**
     * Sign a SAFE (Simple Agreement for Future Equity)
     * @param cap Valuation cap (number or 'uncapped')
     * @param amount Investment amount
     * @param name Investor name
     * @param discount Optional discount rate (0-100%)
     * @param safeType Type of SAFE ('pre-money' or 'post-money')
     */
    public signSafe(
        cap: number | 'uncapped', 
        amount: number, 
        name: string, 
        discount?: number,
        safeType: SafeType = 'post-money'
    ): Company {
        // Record a SAFE
        this.safes.push({ 
            cap, 
            amount, 
            name, 
            converted: false,
            discount,
            type: safeType
        });
        
        const capStr = cap === 'uncapped' ? 'uncapped' : `$${(cap/1000000).toFixed(1)}M cap`;
        const discountStr = discount ? ` with ${discount}% discount` : '';
        this._saveSnapshot(`SAFE: ${name} ($${amount.toLocaleString()}, ${capStr}${discountStr})`);
        
        return this;
    }

    /**
     * Execute a priced financing round
     * @param preMoneyValuation Pre-money valuation
     * @param newMoney New investment amount
     * @param name Name of the round
     */
    public pricedRound(preMoneyValuation: number, newMoney: number, name: string = 'Series A'): Company {
        // Calculate price per share
        const pricePerShare = preMoneyValuation / this.totalShares;
        // Calculate post-money valuation
        const postMoney = preMoneyValuation + newMoney;
        
        // First pass: calculate shares for post-money SAFEs (needs to be done first)
        let postMoneySafeShares = 0;
        
        this.safes.forEach(s => {
            if (!s.converted && s.type === 'post-money') {
                if (s.cap === 'uncapped') {
                    const effectivePrice = s.discount ? 
                        pricePerShare * (1 - s.discount / 100) : pricePerShare;
                    postMoneySafeShares += Math.round(s.amount / effectivePrice);
                } else {
                    // For post-money SAFEs, use cap for price calculation
                    // Regardless of round valuation
                    const capPricePerShare = s.cap / (this.totalShares + postMoneySafeShares);
                    const effectivePrice = s.discount ? 
                        Math.min(capPricePerShare, pricePerShare * (1 - s.discount / 100)) : 
                        Math.min(capPricePerShare, pricePerShare);
                    postMoneySafeShares += Math.round(s.amount / effectivePrice);
                }
            }
        });
        
        // Convert SAFEs
        this.safes.forEach(s => {
            if (!s.converted) {
                let shares = 0;
                
                if (s.type === 'post-money') {
                    // Recalculate for each SAFE with updated total including other post-money SAFEs
                    if (s.cap === 'uncapped') {
                        // For uncapped SAFEs, they convert at round price (with discount if applicable)
                        const effectivePrice = s.discount ? 
                            pricePerShare * (1 - s.discount / 100) : pricePerShare;
                        shares = Math.round(s.amount / effectivePrice);
                    } else {
                        // For capped post-money SAFEs, price is based on the cap
                        const capPricePerShare = s.cap / (this.totalShares + postMoneySafeShares);
                        const effectivePrice = s.discount ? 
                            Math.min(capPricePerShare, pricePerShare * (1 - s.discount / 100)) : 
                            Math.min(capPricePerShare, pricePerShare);
                        shares = Math.round(s.amount / effectivePrice);
                    }
                } else {
                    // Pre-money SAFE calculations
                    if (s.cap === 'uncapped') {
                        // For uncapped SAFEs, they convert at round price (with discount if applicable)
                        const effectivePrice = s.discount ? 
                            pricePerShare * (1 - s.discount / 100) : pricePerShare;
                        shares = Math.round(s.amount / effectivePrice);
                    } else {
                        // For capped pre-money SAFEs, use the more favorable of cap or round price
                        const capPricePerShare = s.cap / this.totalShares;
                        const effectivePrice = s.discount ? 
                            Math.min(capPricePerShare, pricePerShare * (1 - s.discount / 100)) : 
                            Math.min(capPricePerShare, pricePerShare);
                        shares = Math.round(s.amount / effectivePrice);
                    }
                }
                
                if (shares > 0) {
                    this._addEntity(s.name + ' (SAFE)', shares, 'preferred');
                    s.converted = true;
                }
            }
        });
        
        // Issue new round shares
        const seriesShares = Math.round(newMoney / pricePerShare);
        this._addEntity(name, seriesShares, 'preferred');
        
        this._saveSnapshot(`${name}: $${(preMoneyValuation/1000000).toFixed(1)}M pre-money, $${(newMoney/1000000).toFixed(1)}M raised`);
        
        return this;
    }

    public logEquity(): Company {
        console.log('Cap Table:');
        const total = this.totalShares;
        this.capTable.forEach(r => {
            const pct = ((r.shares / total) * 100).toFixed(2);
            console.log(`${r.name}: ${r.shares} shares (${pct}%) [${r.type}]`);
        });
        console.log(`Total shares: ${total}`);
        
        // Show any unconverted SAFEs
        const unconvertedSafes = this.safes.filter(s => !s.converted);
        if (unconvertedSafes.length > 0) {
            console.log('\nUnconverted SAFEs:');
            unconvertedSafes.forEach(s => {
                const capInfo = s.cap === 'uncapped' ? 'uncapped' : `$${s.cap.toLocaleString()} cap`;
                const discountInfo = s.discount ? ` with ${s.discount}% discount` : '';
                console.log(`${s.name}: $${s.amount.toLocaleString()} (${capInfo}${discountInfo}) [${s.type}]`);
            });
        }
        
        return this;
    }
    
    /**
     * Generate a visualization of equity dilution over time
     * @param outputPath File path to save the visualization (PNG)
     * @param width Width of the output image (default: 1600px for high resolution)
     */
    public plot(outputPath: string = 'equity-dilution.png', width: number = 1600): Company {
        plotEquityDilution(this.history, outputPath, width);
        return this;
    }
}