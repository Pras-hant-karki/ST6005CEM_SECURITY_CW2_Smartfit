import "dotenv/config";
import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";
import connectdb from "./db/index.js";
import { app } from "./app.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url)); // Backend/src

let isConnected = false;

export default async function handler(req, res) {
    if (!isConnected) {
        await connectdb();
        isConnected = true;
    }

    return app(req, res);
}

// Resolves a configured cert/key path relative to Backend/ (not the process
// CWD, which varies depending on where `npm run dev`/`start` is invoked from)
// so SSL_KEY_PATH/SSL_CERT_PATH work the same regardless of shell location.
const resolveCertPath = (configuredPath, fallbackFile) =>
    path.resolve(__dirname, "..", configuredPath || path.join("certs", fallbackFile));

if (!process.env.VERCEL) {
    const port = process.env.PORT || 8000;
    const httpsEnabled = process.env.HTTPS_ENABLED === "true";

    connectdb()
        .then(() => {
            isConnected = true;

            if (httpsEnabled) {
                const keyPath = resolveCertPath(process.env.SSL_KEY_PATH, "key.pem");
                const certPath = resolveCertPath(process.env.SSL_CERT_PATH, "cert.pem");

                if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
                    console.error(
                        `HTTPS_ENABLED=true but no certificate was found at "${keyPath}" / "${certPath}". ` +
                        `Run "npm run gen-cert" (see Backend/certs/README.md) or set HTTPS_ENABLED=false to run over HTTP.`
                    );
                    process.exit(1);
                }

                const credentials = {
                    key: fs.readFileSync(keyPath),
                    cert: fs.readFileSync(certPath),
                };

                // Reuses the existing Express app unchanged — only the
                // transport wrapping it differs from the HTTP path below.
                //
                // Deliberately no plain-HTTP listener and no HTTP->HTTPS
                // redirect: this is the only server started when
                // HTTPS_ENABLED=true. A plain HTTP request to this port
                // fails the TLS handshake and the connection is dropped
                // (browser shows a protocol/connection error, not a 301) —
                // there is nothing else running to redirect from. Simpler
                // than a second listener for a dev-only feature; revisit if
                // a redirect is ever actually needed.
                https.createServer(credentials, app).listen(port, "0.0.0.0", () => {
                    console.log(`Backend running on https://0.0.0.0:${port} (self-signed cert — development only, no HTTP fallback on this port)`);
                });
            } else {
                app.listen(port, "0.0.0.0", () => {
                    console.log(`Backend running on http://0.0.0.0:${port}`);
                });
            }
        })
        .catch((error) => {
            console.error("Failed to start backend:", error);
            process.exit(1);
        });
}
