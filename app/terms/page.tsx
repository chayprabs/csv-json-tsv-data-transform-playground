import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for using the Mill data transformation workspace.",
};

const EFFECTIVE_DATE = "29 May 2026";

export default function TermsPage() {
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
        Terms &amp; Conditions
      </h1>
      <p className="mt-2 text-xs text-[color:var(--muted)]">
        Effective date: {EFFECTIVE_DATE}
      </p>
      <div className="mt-8 space-y-5 text-sm leading-7 text-[color:var(--foreground)]">
        <p>
          By accessing or using Mill (the &quot;Service&quot;), you agree to
          these Terms &amp; Conditions. If you do not agree, do not use the
          Service.
        </p>

        <h2 className="text-base font-semibold">The Service</h2>
        <p>
          Mill provides a browser-based workspace to run Miller (
          <code>mlr</code>) style data transformations on data you supply. The
          Service is provided for convenience and experimentation. It is not a
          substitute for professional data engineering, legal, or compliance
          advice.
        </p>

        <h2 className="text-base font-semibold">No warranties</h2>
        <p>
          THE SERVICE AND ALL OUTPUT ARE PROVIDED &quot;AS IS&quot; AND &quot;AS
          AVAILABLE&quot;, WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS,
          IMPLIED, OR STATUTORY, INCLUDING MERCHANTABILITY, FITNESS FOR A
          PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT
          TRANSFORMS WILL BE ERROR-FREE, COMPLETE, OR SUITABLE FOR YOUR USE CASE.
        </p>

        <h2 className="text-base font-semibold">Limitation of liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL
          THE OPERATORS, CONTRIBUTORS, OR HOSTING PROVIDERS OF MILL BE LIABLE FOR
          ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
          OR ANY LOSS OF PROFITS, DATA, GOODWILL, OR BUSINESS INTERRUPTION,
          ARISING FROM OR RELATED TO YOUR USE OF THE SERVICE, EVEN IF ADVISED OF
          THE POSSIBILITY OF SUCH DAMAGES.
        </p>
        <p>
          WHERE LIABILITY CANNOT BE EXCLUDED, OUR AGGREGATE LIABILITY SHALL NOT
          EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID US FOR THE SERVICE IN
          THE TWELVE MONTHS BEFORE THE CLAIM, OR (B) ONE HUNDRED U.S. DOLLARS
          (USD $100).
        </p>

        <h2 className="text-base font-semibold">Your obligations</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            You are solely responsible for the data you paste, commands you run,
            and how you use output.
          </li>
          <li>
            You will not use the Service to violate any law, infringe rights, or
            transmit malware or abusive traffic.
          </li>
          <li>
            You will not attempt to bypass security limits, access other
            users&apos; data, or disrupt the Service.
          </li>
          <li>
            You verify output before relying on it for production or high-stakes
            decisions.
          </li>
        </ul>

        <h2 className="text-base font-semibold">Third-party software</h2>
        <p>
          Mill uses the Miller (<code>mlr</code>) engine and other open-source
          components under their respective licenses. Mill is not affiliated with
          or endorsed by the Miller project maintainers unless stated otherwise.
        </p>

        <h2 className="text-base font-semibold">Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless the Service operators and
          contributors from claims arising out of your use of the Service, your
          data, or your violation of these terms.
        </p>

        <h2 className="text-base font-semibold">Termination</h2>
        <p>
          We may suspend or limit access to the Service at any time for abuse,
          maintenance, or legal reasons. Provisions that by their nature should
          survive termination (disclaimers, limitation of liability,
          indemnification) will survive.
        </p>

        <h2 className="text-base font-semibold">Governing law</h2>
        <p>
          These terms are governed by the laws applicable where the deployment
          operator is established, without regard to conflict-of-law rules. For
          disputes that cannot be resolved informally, you agree to the
          exclusive jurisdiction of courts in that location, except where
          mandatory consumer protection laws in your country require otherwise.
        </p>

        <h2 className="text-base font-semibold">Changes</h2>
        <p>
          We may modify these terms by posting an updated effective date.
          Continued use after changes constitutes acceptance.
        </p>

        <h2 className="text-base font-semibold">Contact</h2>
        <p>
          Questions about these terms may be directed via the{" "}
          <a
            className="text-[color:var(--accent)] hover:underline"
            href="https://github.com/chayprabs/csv-json-tsv-data-transform-playground/issues"
            rel="noopener noreferrer"
            target="_blank"
          >
            GitHub issue tracker
          </a>{" "}
          or{" "}
          <a
            className="text-[color:var(--accent)] hover:underline"
            href="https://www.chaitanyaprabuddha.com"
            rel="noopener noreferrer"
            target="_blank"
          >
            chaitanyaprabuddha.com
          </a>
          .
        </p>
      </div>
    </main>
  );
}
