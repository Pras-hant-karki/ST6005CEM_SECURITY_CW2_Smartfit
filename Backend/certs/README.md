# Backend/certs — local development TLS certificate

This folder holds the **self-signed** TLS key/cert pair the backend uses when
`HTTPS_ENABLED=true`. It is for local development only — never use a
self-signed certificate in production.

`key.pem` and `cert.pem` are git-ignored (see root `.gitignore`) because a
private key must never be committed, even a throwaway dev one. Each
developer generates their own on first setup.

## Generate a certificate

Requires OpenSSL (already present on macOS/Linux; on Windows, Git Bash ships
one, or install it separately).

From the `Backend/` directory:

```bash
npm run gen-cert
```

or run the equivalent command directly:

```bash
openssl req -x509 -newkey rsa:2048 -keyout certs/key.pem -out certs/cert.pem \
  -days 365 -nodes -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:192.168.1.67,IP:0.0.0.0"
```

- `-nodes` — no passphrase on the key (needed so the server can start unattended).
- `-days 365` — regenerate yearly, or sooner if it expires.
- Adjust the `IP:` entries in `subjectAltName` if your machine's LAN IP
  differs from `192.168.1.67` (check the `CORS_ORIGIN_*` values in
  `Backend/.env`) so the cert stays valid for whichever host you browse to.

## Using it

Set in `Backend/.env`:

```
HTTPS_ENABLED=true
SSL_KEY_PATH=./certs/key.pem
SSL_CERT_PATH=./certs/cert.pem
```

Then `npm run dev` / `npm start` as usual — the server logs whether it came
up on `http://` or `https://`.

Browsers will show a "not private" / "self-signed certificate" warning the
first time you visit `https://localhost:8000` (or whichever host) directly —
that's expected for a self-signed cert; click through/accept it once per
browser. This does not weaken any application security control (cookies,
CSRF, auth) — it only affects whether the browser trusts the certificate
issuer.
