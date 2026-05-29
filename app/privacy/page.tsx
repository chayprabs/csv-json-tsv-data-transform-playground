import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for the Mill data transformation workspace.",
};

const EFFECTIVE_DATE = "29 May 2026";

export default function PrivacyPage() {
  return (
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
        Privacy Policy
      </h1>
      <p className="mt-2 text-xs text-[color:var(--muted)]">
        Effective date: {EFFECTIVE_DATE}
      </p>
      <div className="prose-policy mt-8 space-y-5 text-sm leading-7 text-[color:var(--foreground)]">
        <p>
          This Privacy Policy describes how Mill (&quot;we&quot;, &quot;us&quot;,
          or the &quot;Service&quot;) handles information when you use this
          web application. Mill is operated as an open-source project; the
          person or entity hosting a particular deployment is the data
          controller for that instance.
        </p>

        <h2 className="text-base font-semibold">What we process</h2>
        <p>
          When you run a transformation, the data you paste, your command, and
          format selections are transmitted to the server hosting Mill and
          processed in memory to produce output. Mill is not designed for
          long-term storage of your datasets; successful runs may be cached
          briefly in server memory (typically up to ten minutes) to improve
          performance.
        </p>
        <p>
          We may also process technical information such as your IP address,
          request timestamps, and browser type for rate limiting, security, and
          operations. We do not use third-party advertising trackers in the
          default open-source deployment.
        </p>

        <h2 className="text-base font-semibold">What we do not do</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>We do not sell your personal information.</li>
          <li>
            We do not require an account to use the public workspace in the
            default deployment.
          </li>
          <li>
            We do not guarantee that pasted data is suitable for regulated
            categories (health, financial, children&apos;s data, etc.) without
            your own legal review.
          </li>
        </ul>

        <h2 className="text-base font-semibold">Your responsibilities</h2>
        <p>
          Do not paste confidential, proprietary, or personal data you are not
          authorized to send over the network. You are responsible for
          compliance with laws and contracts that apply to you.
        </p>

        <h2 className="text-base font-semibold">Retention</h2>
        <p>
          Transform inputs are not intentionally persisted to disk by the
          application code paths described in the project documentation.
          Operators of self-hosted instances control server logs, backups, and
          infrastructure retention. Contact your deployment operator for
          details.
        </p>

        <h2 className="text-base font-semibold">International transfers</h2>
        <p>
          If you access a deployment hosted in another country, your data may be
          processed there. Use a self-hosted instance in your jurisdiction if
          required.
        </p>

        <h2 className="text-base font-semibold">Your rights</h2>
        <p>
          Depending on your location, you may have rights to access, correct,
          delete, or restrict processing of personal data. Because Mill does not
          maintain user accounts in the default deployment, we may be unable to
          identify data solely from a past request. Contact the deployment
          operator with reasonable details if you believe we processed your
          personal data.
        </p>

        <h2 className="text-base font-semibold">Children</h2>
        <p>
          The Service is not directed at children under 13 (or the minimum age
          in your jurisdiction). Do not use the Service if you are under that
          age.
        </p>

        <h2 className="text-base font-semibold">Changes</h2>
        <p>
          We may update this policy by posting a new effective date. Continued
          use after changes constitutes acceptance of the updated policy.
        </p>

        <h2 className="text-base font-semibold">Contact</h2>
        <p>
          For the public deployment maintained by the project authors, contact{" "}
          <a
            className="text-[color:var(--accent)] hover:underline"
            href="https://www.chaitanyaprabuddha.com"
            rel="noopener noreferrer"
            target="_blank"
          >
            Chaitanya Prabuddha
          </a>{" "}
          or open an issue on the{" "}
          <a
            className="text-[color:var(--accent)] hover:underline"
            href="https://github.com/chayprabs/csv-json-tsv-data-transform-playground"
            rel="noopener noreferrer"
            target="_blank"
          >
            GitHub repository
          </a>
          .
        </p>
      </div>
    </main>
  );
}
