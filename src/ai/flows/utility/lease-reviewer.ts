
'use server';

/**
 * @fileOverview An AI flow to analyze a lease agreement for potential risks and non-standard clauses.
 *
 * This flow acts as an AI paralegal, reviewing a lease document and providing a structured analysis
 * to help agents and clients identify areas for concern or negotiation.
 */

import { googleAI } from '@genkit-ai/googleai';
import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define the structured input for the lease reviewer flow
const LeaseReviewerInputSchema = z.object({
  leaseDocumentUri: z
    .string()
    .describe(
      "The lease agreement document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  userRole: z.enum(['Landlord', 'Tenant', 'Agent']).describe("The role of the person for whom the review is being conducted, which will tailor the analysis."),
});
export type LeaseReviewerInput = z.infer<typeof LeaseReviewerInputSchema>;


const ClauseAnalysisSchema = z.object({
    clause: z.string().describe("The name or number of the clause being analyzed (e.g., 'Clause 5.2: Maintenance Responsibilities')."),
    summary: z.string().describe("A simple summary of what the clause means."),
    riskLevel: z.enum(['Low', 'Medium', 'High', 'Informational']).describe("The assessed risk level of this clause for the user."),
    recommendation: z.string().describe("A suggested action or point of negotiation for the user."),
});

// Define the structured output for the review
const LeaseReviewerOutputSchema = z.object({
  overallSummary: z.string().describe("A high-level summary of the lease's fairness and any major red flags."),
  analysis: z.array(ClauseAnalysisSchema).describe("A detailed, clause-by-clause analysis of the document."),
});
export type LeaseReviewerOutput = z.infer<typeof LeaseReviewerOutputSchema>;


const leaseReviewerPrompt = ai.definePrompt({
  name: 'leaseReviewerPrompt',
  input: { schema: LeaseReviewerInputSchema },
  output: { schema: LeaseReviewerOutputSchema },
  model: googleAI.model('gemini-2.5-flash'),
  prompt: `
    You are an expert AI paralegal specializing in UAE real estate law. Your task is to review the provided lease agreement from the perspective of the specified user role and identify any non-standard clauses, potential risks, or areas for negotiation.

    **User Role:** {{{userRole}}}
    **Lease Document:** {{media url=leaseDocumentUri}}

    **Instructions:**
    1.  **Overall Summary:** Provide a brief, high-level summary of the lease. Is it a standard contract, or does it have unusual terms? Mention any major red flags immediately.
    2.  **Clause-by-Clause Analysis:** Go through the document and identify at least 3-5 key clauses that are most relevant to the user's role. For each clause:
        *   Identify the clause number or title.
        *   Summarize its meaning in plain language.
        *   Assign a risk level ('Low', 'Medium', 'High', 'Informational') from the perspective of the *user's role*.
        *   Provide a clear recommendation or point of clarification (e.g., "Recommend clarifying who bears the cost for major AC repairs," or "This is a standard clause, no action needed.").
    3.  **Focus on the User's Perspective:** A clause that is good for a Landlord might be a risk for a Tenant. Tailor your risk assessment and recommendations accordingly.
  `,
});


export const leaseReviewerFlow = ai.defineFlow(
  {
    name: 'leaseReviewerFlow',
    inputSchema: LeaseReviewerInputSchema,
    outputSchema: LeaseReviewerOutputSchema,
  },
  async (input) => {
    
    const { output } = await leaseReviewerPrompt(input);

    if (!output) {
        throw new Error("The AI failed to review the lease document.");
    }
    
    return output;
  }
);
