import { Info } from 'lucide-react';

/**
 * Honest label for pages that still show sample/placeholder data instead of a
 * user's real records. Prevents fabricated rows from reading as real data.
 */
export function PreviewBanner({ feature = 'This page' }: { feature?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-300/40 bg-amber-300/10 p-3 text-sm text-amber-700 dark:text-amber-200">
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        {feature} shows <b>sample data</b> for now — it isn&apos;t connected to your account yet.
        We&apos;re building the live version.
      </p>
    </div>
  );
}
