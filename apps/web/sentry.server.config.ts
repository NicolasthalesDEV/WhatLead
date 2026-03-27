// sentry.server.config.ts — loaded by Next.js on the server / edge runtime
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    enabled: process.env.NODE_ENV === "production",
    tracesSampleRate: 0.1,
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers["authorization"];
        delete event.request.headers["cookie"];
      }
      return event;
    },
    ignoreErrors: [
      "AbortError",
      "Network request failed",
    ],
  });
}
