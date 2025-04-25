#!/usr/bin/env -S deno run --allow-all

import { transform } from "../mod.ts";

// Get input
const html = Deno.args[0] || "";

// Run transformation with debug info
console.log("=== INPUT HTML ===");
console.log(html);
console.log("\n=== OUTPUT ===");
const result = transform(html);

// Debug with JSON to see exact characters
console.log("\n=== JSON OUTPUT ===");
console.log(JSON.stringify(result));
