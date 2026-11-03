`supabase-ca.crt` is the public Supabase Root 2021 CA certificate, downloaded over HTTPS from:
https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt

The database adapter uses it for certificate and hostname verification. It contains no private key or password. Include it in deployments; `DATABASE_CA_CERT` can override the bundled public CA. See https://supabase.com/docs/guides/platform/ssl-enforcement.
