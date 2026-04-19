import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.2,          // capture 20% of transactions
  replaysOnErrorSampleRate: 1.0,  // capture 100% of sessions with errors
  replaysSessionSampleRate: 0.05, // capture 5% of normal sessions
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  enabled: process.env.NODE_ENV === "production",
});
