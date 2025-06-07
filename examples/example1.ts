// assume you’ve already done:
import {Company} from "../src/Company.js";

const c = new Company({
    founders: [
        { name: "Name1", ownership: 50 },
        { name: "Name2",   ownership: 40 },
    ],
    pools: [
        { note: "Option Pool", ownership: 10 },
    ]
});

// 1) Small Angel equity round (no SAFE) — 5% for $50 K
c.giveEquity(5,"Angel Investor");

// 2) A $500 K “pre-seed” SAFE at a $4 M post-money cap with 20% discount
c.signSafe(4_000_000, 500_000, "Pre-seed SAFE", 20, "post-money");

// 3) A “super-angel” SAFE: $1 M at a $6 M post-money cap, 15% discount
c.signSafe(6_000_000, 1_000_000, "Super-Angel SAFE", 15, "post-money");

// 4) Seed priced round: raise $1.5 M at an $8 M pre-money valuation
c.pricedRound(8_000_000, 1_500_000, "Seed Round");

// 5) Series A: $6 M at a $30 M pre-money valuation
c.pricedRound(30_000_000, 6_000_000, "Series A");

// 6) Series B: $25 M at a $120 M pre-money valuation
c.pricedRound(120_000_000, 25_000_000, "Series B");

// Now inspect and visualize:
c.logEquity()
    .plot("./example1.png");
