import { createCanvas } from 'canvas';
import fs from 'fs';
import { EquitySnapshot, ShareType } from './types.js';

// Color palette for visualization
export const COLORS = {
  // Primary share type colors
  common: '#3498db',    // River blue
  preferred: '#e74c3c', // Alizarin red
  option: '#f39c12',    // Dull orange
  
  // Colors for individual stakeholders
  founder1: '#1abc9c',  // Turquoise
  founder2: '#16a085',  // Green sea
  investor1: '#9b59b6', // Amethyst
  investor2: '#8e44ad', // Plum
  investor3: '#e67e22', // Carrot
  investor4: '#d35400', // Pumpkin
  investor5: '#2ecc71', // Emerald
  investor6: '#27ae60', // Nephritis
  employee: '#cddc39',  // Lime
  seed: '#c0392b',      // Pomegranate
  seriesA: '#8bc34a',   // Light green
  seriesB: '#2980b9',   // Belize
  seriesC: '#ff5722',   // Blood orange
  seriesD: '#9c27b0',   // Purple
};

/**
 * Generate a visualization of equity dilution over time
 * @param history Array of equity snapshots
 * @param outputPath File path to save the visualization (PNG)
 * @param width Width of the output image (default: 1600px)
 */
export function plotEquityDilution(
  history: EquitySnapshot[], 
  outputPath: string = 'equity-dilution.png', 
  width: number = 1600
): void {
  // Calculate the base width (pre-scaling)
  const baseWidth = width / 2;
  
  // Canvas setup with high resolution (2x display density)
  const scale = 2; // Increase resolution by 2x for retina-like quality
  const rowHeight = 120;
  const height = (history.length * rowHeight + 150); // Extra padding at bottom
  
  // Create canvas with the full scaled dimensions
  const canvas = createCanvas(width, height * scale);
  const ctx = canvas.getContext('2d');
  
  // Scale all drawing operations
  ctx.scale(scale, scale);
  
  // Fill background
  ctx.fillStyle = '#fcfcfc'; // Off-white background
  ctx.fillRect(0, 0, baseWidth, height);
  
  // Draw title
  ctx.font = 'bold 22px Arial';
  ctx.fillStyle = '#34495e'; // Asphalt color for text
  ctx.fillText('Equity Dilution Visualization', 20, 30);
  
  // Draw semi-transparent background for legend (will be filled in last snapshot)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillRect(baseWidth - 360, 10, 340, 200);
  
  // Setup
  const barHeight = 60;
  const textPadding = 5;
  const leftMargin = 20;
  const rightMargin = 20;
  const barWidth = baseWidth - leftMargin - rightMargin;
  
  // Map entity names to consistent colors
  const entityColorMap = new Map<string, string>();
  
  // Assign consistent colors to entities
  const getEntityColor = (name: string, type: ShareType): string => {
    // Special case for founders
    if (name === 'Founders') {
      return COLORS.founder1;
    }
    
    // If we already assigned a color, use it
    if (entityColorMap.has(name)) {
      return entityColorMap.get(name)!;
    }
    
    // First-time assignment based on name and type
    let color = '';
    
    if (name.toLowerCase().includes('founder') || name === 'Name1' || name === 'Name2') {
      color = name === 'Name1' ? COLORS.founder1 : COLORS.founder2;
    } else if (name.toLowerCase().includes('pool') || name.toLowerCase().includes('employee')) {
      color = COLORS.employee;
    } else if (name.toLowerCase().includes('series a') || name === 'Series A') {
      color = COLORS.seriesA;
    } else if (name.toLowerCase().includes('series b')) {
      color = COLORS.seriesB;
    } else if (name.toLowerCase().includes('series c')) {
      color = COLORS.seriesC;
    } else if (name.toLowerCase().includes('series d')) {
      color = COLORS.seriesD;
    } else if (name.toLowerCase().includes('seed') || name === 'Seed Round') {
      color = COLORS.seed;
    } else if (name.toLowerCase().includes('investor 1') || name.toLowerCase().includes('investor1')) {
      color = COLORS.investor1;
    } else if (name.toLowerCase().includes('investor 2') || name.toLowerCase().includes('investor2')) {
      color = COLORS.investor2;
    } else if (name.toLowerCase().includes('investor 3') || name.toLowerCase().includes('investor3')) {
      color = COLORS.investor3;
    } else if (name.toLowerCase().includes('investor 4') || name.toLowerCase().includes('investor4')) {
      color = COLORS.investor4;
    } else if (name.toLowerCase().includes('investor 5') || name.toLowerCase().includes('investor5')) {
      color = COLORS.investor5;
    } else if (name.toLowerCase().includes('investor 6') || name.toLowerCase().includes('investor6')) {
      color = COLORS.investor6;
    } else {
      // Fallback to type-based color
      color = COLORS[type];
    }
    
    // Store for consistent usage
    entityColorMap.set(name, color);
    return color;
  };
  
  // Add more top padding to accommodate the legend
  const topPadding = 175;
  
  // Loop through each snapshot in history
  history.forEach((snapshot, index) => {
    const y = topPadding + index * rowHeight;
    
    // Draw snapshot label
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#34495e'; // Asphalt color for text
    ctx.fillText(snapshot.label, leftMargin, y - 10);
    
    // Draw bar segments
    let xOffset = leftMargin;
    
    // First, process entries to group founders
    let processedEntries = [...snapshot.entries];
    
    // Find founder entries
    const founderEntries = processedEntries.filter(entry => 
      entry.name === 'Name1' || 
      entry.name === 'Name2' || 
      entry.name.toLowerCase().includes('founder')
    );
    
    // If we have founder entries, combine them
    if (founderEntries.length > 0) {
      // Remove original founder entries
      processedEntries = processedEntries.filter(entry => 
        !(entry.name === 'Name1' || 
          entry.name === 'Name2' || 
          entry.name.toLowerCase().includes('founder'))
      );
      
      // Calculate total founder shares and percentage
      const totalFounderShares = founderEntries.reduce((sum, entry) => sum + entry.shares, 0);
      const founderPercentage = (totalFounderShares / snapshot.totalShares) * 100;
      
      // Add combined founder entry at the beginning
      processedEntries.unshift({
        name: 'Founders',
        shares: totalFounderShares,
        type: 'common', // Founders typically have common shares
        percentage: founderPercentage
      });
    }
    
    // Sort entries by type for better visualization
    const sortedEntries = [...processedEntries].sort((a, b) => {
      // Keep founders first
      if (a.name === 'Founders') return -1;
      if (b.name === 'Founders') return 1;
      
      // Then sort by type
      const typeOrder = { common: 1, option: 2, preferred: 3 };
      return typeOrder[a.type] - typeOrder[b.type];
    });
    
    sortedEntries.forEach(entry => {
      // Calculate width of this segment
      const segmentWidth = (entry.shares / snapshot.totalShares) * barWidth;
      
      // Get color for this entity
      const color = getEntityColor(entry.name, entry.type);
      
      // Draw rectangle for this equity holder
      ctx.fillStyle = color;
      ctx.fillRect(xOffset, y, segmentWidth, barHeight);
      
      // Draw border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(xOffset, y, segmentWidth, barHeight);
      
      // Only add label if segment is wide enough
      if (segmentWidth > 50) {
        // Calculate text color for better contrast
        // Simple luminance calculation to determine if we should use white or black text
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        const textColor = luminance > 0.5 ? '#000000' : '#ffffff';
        
        // Draw entity name
        ctx.font = '12px Arial';
        ctx.fillStyle = textColor;
        const truncatedName = entry.name.length > 15 ? 
          entry.name.substring(0, 12) + '...' : entry.name;
        
        // Center text
        const textWidth = ctx.measureText(truncatedName).width;
        if (textWidth < segmentWidth - 10) {
          ctx.fillText(
            truncatedName, 
            xOffset + (segmentWidth / 2) - (textWidth / 2), 
            y + barHeight / 2
          );
        }
        
        // Draw percentage
        ctx.font = '10px Arial';
        const percentText = `${entry.percentage.toFixed(1)}%`;
        const percentWidth = ctx.measureText(percentText).width;
        
        if (percentWidth < segmentWidth - 10) {
          ctx.fillText(
            percentText,
            xOffset + (segmentWidth / 2) - (percentWidth / 2),
            y + barHeight / 2 + 15
          );
        }
      }
      
      xOffset += segmentWidth;
    });
    
    // Draw legend at the top right for all snapshots
    if (index === 0) {
      // Position legend in the top right corner
      const legendX = baseWidth - 350; // Position from right edge
      const legendY = 30; // Position from top
      
      // Create a legend showing all key stakeholders in the current snapshot
      const legendTitle = "Legend";
      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = '#34495e';
      ctx.fillText(legendTitle, legendX, legendY);
      
      // Draw divider line
      ctx.strokeStyle = '#bdc3c7';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(legendX, legendY + 10);
      ctx.lineTo(legendX + 300, legendY + 10);
      ctx.stroke();
      
      // Group stakeholders by type and role
      const stakeholderGroups = new Map<string, { color: string, entries: string[] }>();
      
      // Get all stakeholders from the last snapshot for a complete legend
      const lastSnapshot = history[history.length - 1];
      
      // Process the last snapshot to combine founders
      let finalEntries = [...lastSnapshot.entries];
      
      // Find founder entries in the last snapshot
      const finalFounderEntries = finalEntries.filter(entry => 
        entry.name === 'Name1' || 
        entry.name === 'Name2' || 
        entry.name.toLowerCase().includes('founder')
      );
      
      // If we have founder entries, use a combined "Founders" entry
      if (finalFounderEntries.length > 0) {
        stakeholderGroups.set('Founders', { 
          color: COLORS.founder1, 
          entries: finalFounderEntries.map(e => e.name)
        });
      }
      
      // Group employee pools
      const poolNames = finalEntries.filter(entry => 
        entry.name.toLowerCase().includes('pool') || 
        entry.name.toLowerCase().includes('employee'))
        .map(entry => entry.name);
      
      if (poolNames.length > 0) {
        stakeholderGroups.set('Employee Pool', { 
          color: COLORS.employee, 
          entries: poolNames 
        });
      }
      
      // Add all other stakeholders individually
      finalEntries.forEach(entry => {
        const isFounder = entry.name === 'Name1' || entry.name === 'Name2' || 
                         entry.name.toLowerCase().includes('founder');
        const isPool = poolNames.includes(entry.name);
        
        if (!isFounder && !isPool) {
          const color = getEntityColor(entry.name, entry.type);
          let groupName = entry.name;
          
          // For SAFEs, format consistently
          if (entry.name.includes('(SAFE)')) {
            const baseName = entry.name.replace(' (SAFE)', '');
            groupName = `${baseName} (SAFE)`;
          }
          
          stakeholderGroups.set(groupName, { 
            color: color, 
            entries: [entry.name] 
          });
        }
      });
      
      // Convert map to array for easier processing
      const groupEntries = Array.from(stakeholderGroups.entries());
      
      // Sort groups (founders first, then pools, then others alphabetically)
      groupEntries.sort((a, b) => {
        if (a[0] === 'Founders') return -1;
        if (b[0] === 'Founders') return 1;
        if (a[0] === 'Employee Pool') return -1;
        if (b[0] === 'Employee Pool') return 1;
        
        // Sort remaining entries alphabetically
        return a[0].localeCompare(b[0]);
      });
      
      // Draw stakeholder groups in two columns
      const legendItemHeight = 24;
      const columnWidth = 160;
      const maxItemsPerColumn = Math.ceil(groupEntries.length / 2);
      
      groupEntries.forEach(([groupName, { color }], i) => {
        // Calculate position (2 columns)
        const column = Math.floor(i / maxItemsPerColumn);
        const row = i % maxItemsPerColumn;
        
        const itemX = legendX + (column * columnWidth);
        const itemY = legendY + 30 + (row * legendItemHeight);
        
        // Draw color square
        ctx.fillStyle = color;
        ctx.fillRect(itemX, itemY, 16, 16);
        
        // Draw stakeholder name
        ctx.font = '13px Arial';
        ctx.fillStyle = '#34495e';
        const displayName = groupName.length > 18 ? groupName.substring(0, 15) + '...' : groupName;
        ctx.fillText(displayName, itemX + 24, itemY + 12);
      });
    }
  });
  
  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  
  console.log(`Equity dilution visualization saved to ${outputPath}`);
}