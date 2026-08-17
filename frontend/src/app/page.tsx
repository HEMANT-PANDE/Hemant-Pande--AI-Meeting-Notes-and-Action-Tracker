"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  Search,
  Sparkles,
  Upload,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { LandingNavbar } from "@/components/layout/LandingNavbar";
import { LandingFooter } from "@/components/layout/LandingFooter";
import { Spinner } from "@/components/ui/Spinner";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI-generated summaries",
    description:
      "Every transcript is distilled into a summary, key discussion points, decisions, risks, and open questions — no invented details.",
  },
  {
    icon: ListChecks,
    title: "Automatic action items",
    description:
      "Owners, due dates, and priority are extracted where the transcript actually supports them, and left honestly unassigned when it doesn't.",
  },
  {
    icon: LayoutDashboard,
    title: "One tracker, every meeting",
    description:
      "Filter by status, priority, owner, or due date across all your meetings — see what's overdue at a glance.",
  },
  {
    icon: Upload,
    title: "Paste or upload",
    description: "Drop in a transcript as plain text or a .txt file — the workflow is identical either way.",
  },
];

const STEPS = [
  {
    icon: ClipboardList,
    title: "Create a meeting",
    description: "Add the title, date, type, and participants, then paste or upload the transcript.",
  },
  {
    icon: Sparkles,
    title: "AI does the reading",
    description: "Insights and action items are generated automatically and saved with the meeting.",
  },
  {
    icon: CheckCircle2,
    title: "Track it to done",
    description: "Review, edit, and update action items from the central tracker until they're closed out.",
  },
];

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Loading…" />
      </div>
    );
  }

  // Authenticated users are redirected above; avoid a flash of landing
  // content while that navigation is in flight.
  if (user) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <LandingNavbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:py-24">
          <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            AI-powered meeting notes
          </span>
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Turn meeting transcripts into tracked action, automatically
          </h1>
          <p className="max-w-xl text-base text-muted sm:text-lg">
            Paste or upload a transcript. Get a structured summary, key decisions, and action items — with
            owners and due dates inferred, never invented — then track everything to completion in one
            place.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                I already have an account
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-16 border-t border-border bg-surface/50">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-center text-2xl font-semibold text-foreground">
              Everything a meeting leaves behind, organized
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="rounded-xl border border-border bg-surface p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-medium text-foreground">{feature.title}</h3>
                  <p className="mt-1.5 text-sm text-muted">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-16 mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center text-2xl font-semibold text-foreground">How it works</h2>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title} className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <step.icon className="h-5 w-5" />
                </div>
                <p className="mt-3 text-xs font-medium text-muted">Step {i + 1}</p>
                <h3 className="mt-1 font-medium text-foreground">{step.title}</h3>
                <p className="mt-1.5 max-w-xs text-sm text-muted">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border bg-surface/50">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-16 text-center">
            <CalendarClock className="h-8 w-8 text-primary" />
            <h2 className="text-2xl font-semibold text-foreground">Stop losing decisions in the transcript</h2>
            <p className="max-w-md text-sm text-muted">
              Create your first meeting record in under a minute — no credit card, no setup.
            </p>
            <Link href="/register">
              <Button size="lg">
                <Search className="h-4 w-4" />
                Create your first meeting
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
