// Example usage:
import { Company } from "./src/Company.js";

// Create a new company with founders and an option pool
const c = new Company({
  founders: [
    { name: 'Name1', ownership: 45 }, 
    { name: 'Name2', ownership: 45 }
  ],
  pools: [
    { note: 'Employee Equity Pool', ownership: 10 }
  ]
});

// Simulate equity events
c
  .giveEquity(5, 'Investor 1')
  .signSafe('uncapped', 100_000, 'Investor 1', 0, "post-money") // Uncapped SAFE with 20% discount
  .signSafe(5_000_000, 150_000, 'Investor 2', 10, 'post-money') // Post-money SAFE with $4.5M cap and 10% discount
  .pricedRound(5_000_000, 1_000_000, 'Seed Round') // Seed round at $5M pre-money
  .pricedRound(40_000_000, 11_000_000, 'Series A') // Series A at $10M pre-money
  .pricedRound(220_000_000, 80_000_000, 'Series B') // Series B at $20M pre-money
  .logEquity()
  .plot('equity-dilution.png'); // Generate visualization