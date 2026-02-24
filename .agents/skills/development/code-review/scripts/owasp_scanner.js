#!/usr/bin/env node

const args = process.argv.slice(2);
console.log("🛡️ OWASP Vulnerability Static Scanner (Mock)");

if (args.length > 0) {
    console.log(`Scanning directory: ${args[0]}`);
}
console.log("...");
console.log("🚨 HIGH: SQL Injection Vector Detected.");
console.log("   File: src/repositories/UserRepository.js:42");
console.log("   Cause: Template literal string used in `db.query()`. Use parameterized queries Instead.");
console.log("");
console.log("⚠️ MED: Potential XSS Vector.");
console.log("   File: src/components/Blogpost.tsx:14");
console.log("   Cause: `dangerouslySetInnerHTML` found. Ensure the input string has been passed through DOMPurify.");
console.log("✅ Scan complete. 2 vulnerabilities found.");
