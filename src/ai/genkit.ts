// Server-side Genkit singleton. Deliberately NOT a 'use server' module: that
// directive is for Server Actions and forbids object exports like `ai`.

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { enableFirebaseTelemetry } from '@genkit-ai/firebase'; // Corrected import for telemetry
import { adminApp } from '@/lib/firebaseAdmin';

// (Optional) enable Genkit → Firebase telemetry
enableFirebaseTelemetry();

export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1',
    }),
    // Removed: firebase({ app: adminApp }) - as it no longer exists in this package version
  ],
});
