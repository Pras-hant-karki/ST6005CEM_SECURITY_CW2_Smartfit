import "dotenv/config";
import connectdb from "./db/index.js";
import { app } from "./app.js";

let isConnected = false;

export default async function handler(req, res) {
    if (!isConnected) {
        await connectdb();
        isConnected = true;
    }

    return app(req, res);
}

if (!process.env.VERCEL) {
    const port = process.env.PORT || 8000;

    connectdb()
        .then(() => {
            isConnected = true;
            // app.listen(port, () => {
            //     console.log(`Backend running at http://192.168.1.67:${port}`);
            // });
            app.listen(port, "0.0.0.0", () => {
                console.log(`Backend running on port ${port}`);
            });
        })
        .catch((error) => {
            console.error("Failed to start backend:", error);
            process.exit(1);
        });
}
