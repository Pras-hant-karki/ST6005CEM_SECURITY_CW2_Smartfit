import { useEffect, useRef } from "react";

const SITEKEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY || "10000000-ffff-ffff-ffff-000000000001";

export default function HCaptcha({ onVerify }) {
    const containerRef = useRef(null);
    const widgetRef = useRef(null);

    useEffect(() => {
        const render = () => {
            if (!containerRef.current || widgetRef.current !== null) return;
            if (typeof window.hcaptcha === "undefined") return;
            widgetRef.current = window.hcaptcha.render(containerRef.current, {
                sitekey: SITEKEY,
                callback: onVerify,
                "expired-callback": () => onVerify(""),
            });
        };

        if (typeof window.hcaptcha !== "undefined") {
            render();
        } else {
            const existing = document.getElementById("hcaptcha-script");
            if (!existing) {
                const script = document.createElement("script");
                script.id = "hcaptcha-script";
                script.src = "https://js.hcaptcha.com/1/api.js?render=explicit";
                script.async = true;
                script.defer = true;
                script.onload = render;
                document.head.appendChild(script);
            } else {
                const poll = setInterval(() => {
                    if (typeof window.hcaptcha !== "undefined") {
                        clearInterval(poll);
                        render();
                    }
                }, 50);
                return () => clearInterval(poll);
            }
        }

        return () => {
            if (widgetRef.current !== null && typeof window.hcaptcha !== "undefined") {
                try { window.hcaptcha.reset(widgetRef.current); } catch { /* widget already gone */ }
                widgetRef.current = null;
            }
        };
    }, [onVerify]);

    return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
            <p className="text-sm font-medium text-amber-800 text-center">
                Additional verification required due to suspicious activity.
            </p>
            <div className="flex justify-center">
                <div ref={containerRef} />
            </div>
        </div>
    );
}
