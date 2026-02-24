#!/usr/bin/env node

const args = process.argv.slice(2);
console.log("📦 Bundle Size Analyzer (Mock)");

if (args.length > 0) {
    console.log(`Analyzing build stats from: ${args[0]}`);
}

console.log("...");
console.log("🚨 WARNING: 'moment.js' detected in main chunk (320kb). Suggest replacing with 'date-fns' or 'dayjs'.");
console.log("🚨 WARNING: 'lodash' imported fully. Suggest using localized imports e.g., 'lodash/debounce'.");
console.log("ℹ️ INFO: Vendor chunk is 1.2MB. Consider aggressive code-splitting at the Route level using React.lazy().");
console.log("✅ Analysis complete. See bundle-report.html for the visual treemap.");
