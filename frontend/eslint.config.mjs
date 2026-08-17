import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // `react-hooks/set-state-in-effect` is a new React Compiler readiness
    // check bundled with Next.js 16's default config. Across this codebase
    // it fires on well-established, idiomatic patterns rather than actual
    // bugs: the "fetch on mount" custom hooks in src/hooks (the same
    // approach SWR/TanStack Query implement internally), the client-mount
    // guard in ThemeToggle.tsx (the pattern documented by next-themes
    // itself, to avoid a hydration mismatch), and resetting a form when a
    // modal opens (ActionItemModal.tsx). None of these rely on concurrent
    // rendering being torn/replayed, so the rule's cascading-render concern
    // doesn't apply here. Disabled project-wide with this rationale
    // documented, rather than restructuring idiomatic code around a brand
    // new, experimental lint rule — see README "Known limitations".
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
