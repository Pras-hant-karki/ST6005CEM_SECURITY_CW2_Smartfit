import swaggerJSDoc from "swagger-jsdoc";
import path from "path";
import { fileURLToPath } from "url";
import { swaggerDefinition } from "./swaggerDef.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// swagger-jsdoc merges the static `swaggerDefinition` (info/servers/tags/
// components) with every `@openapi` JSDoc block found in the files matched
// below. These *.docs.js files are pure documentation — no route/controller
// file is scanned or imported here, so this has zero effect on request
// handling even if the docs are wrong or this module fails to load (app.js
// only mounts it as an additional, isolated route — see server.docs.js).
// glob (used internally by swagger-jsdoc) expects forward slashes even on
// Windows — a raw path.join() result with backslashes silently matches zero
// files there instead of erroring, which is why this normalizes explicitly.
const docsGlob = path.join(__dirname, "*.docs.js").split(path.sep).join("/");

const options = {
  definition: swaggerDefinition,
  apis: [docsGlob],
};

export const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
