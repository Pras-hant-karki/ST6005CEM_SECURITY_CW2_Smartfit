// Backend has no bundler — it runs directly on Node via ESM. "Build" here
// means the closest honest equivalent: importing the full app module graph
// (every route -> controller -> model -> util) and confirming nothing throws
// a syntax/import-resolution error. This deliberately imports app.js, not
// index.js — app.js only wires Express middleware/routes and has no
// top-level side effects (no server listen, no DB connection, no required
// env vars), so this check needs no secrets and no live services to run in CI.
import { app } from "../src/app.js";

if (typeof app !== "function") {
  console.error("Backend build check failed: app.js did not export a valid Express app.");
  process.exit(1);
}

console.log("Backend build check passed: full module graph (routes, controllers, models, middleware) imported without error.");
