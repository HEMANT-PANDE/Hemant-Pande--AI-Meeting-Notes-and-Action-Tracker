import Link from "next/link";
import { CheckCheck } from "lucide-react";

const PRODUCT_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
];

const ACCOUNT_LINKS = [
  { href: "/login", label: "Log in" },
  { href: "/register", label: "Register" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="sm:col-span-2 md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <CheckCheck className="h-3.5 w-3.5" />
              </span>
              <span className="font-semibold text-foreground">Nexora</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted">
              Store meeting transcripts, generate AI summaries, and track action items to
              completion — all in one place.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-foreground">Product</h3>
            <ul className="mt-3 flex flex-col gap-2">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-sm text-muted hover:text-foreground">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-foreground">Account</h3>
            <ul className="mt-3 flex flex-col gap-2">
              {ACCOUNT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-2 border-t border-border pt-6 text-center text-xs text-muted sm:flex-row sm:justify-between sm:text-left">
          <p>© {new Date().getFullYear()} Nexora.</p>
          <p>Built with Next.js, Express, Prisma &amp; Gemini.</p>
        </div>
      </div>
    </footer>
  );
}
