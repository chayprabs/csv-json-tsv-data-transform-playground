import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy — Mill",
  description: "How Mill handles data in this browser workspace.",
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-1 flex-col">
      <main
        className="mx-auto min-h-[60vh] w-full max-w-2xl flex-1 px-4 py-12 sm:px-6"
        id="main-content"
      >
        <p className="mb-6 text-sm text-[color:var(--muted)]">
          <Link
            className="font-medium text-[color:var(--accent)] hover:underline"
            href="/"
          >
            ← Back to Mill
          </Link>
        </p>
        <h1 className="text-2xl font-semibold text-[color:var(--foreground)]">
          Privacy
        </h1>
        <div className="mt-6 space-y-4 text-sm leading-6 text-[color:var(--foreground)]">
          <p>
            Mill is a server-side tool: when you run a transform, the data you
            pasted and your command are sent to this application&apos;s servers
            (or your self-hosted instance) for processing. Do not use Mill for
            data you are not permitted to send over the network.
          </p>
          <p>
            This deployment does not implement user accounts. Do not rely on
            this notice for HIPAA, GDPR, or other compliance regimes without a
            formal assessment and appropriate agreements.
          </p>
          <p>
            Operators should configure retention, logging, and access controls
            on their own infrastructure. For questions about a specific site,
            contact that site&apos;s administrator.
          </p>
        </div>
      </main>
    </div>
  );
}
