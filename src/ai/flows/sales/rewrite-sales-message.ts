'use server';

/**
 * @fileOverview An AI flow to rewrite sales messages for different tones and strategies.
 *
 * This flow acts as a "Grammarly for Sales," taking a user's draft message
 * and generating several improved versions tailored for specific outcomes.
 *
 * @module AI/Flows/Sales/RewriteSalesMessage
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

/**
 * Defines the schema for the input of the message rewriter flow.
 */
const RewriteSalesMessageInputSchema = z.object({
  originalMessage: z.string().min(5, 'The message must be at least 5 characters long.').describe('The original sales message written by the user.'),
  tone: z.enum(['More Professional', 'More Friendly & Casual', 'Create Urgency', 'More Persuasive', 'Shorten & Simplify']).describe('The desired tone or strategy for the rewritten message.'),
});
export type RewriteSalesMessageInput = z.infer<typeof RewriteSalesMessageInputSchema>;

/**
 * Defines the schema for the output of the message rewriter flow.
 */
const RewriteSalesMessageOutputSchema = z.object({
  rewrittenMessages: z.array(
    z.object({
      strategy: z.string().describe("The specific strategy applied for this version (e.g., 'Added a Clear Call-to-Action')."),
      message: z.string().describe('The rewritten message.'),
    })
  ).describe('A list of 3-5 distinct rewritten message variations.'),
});
export type RewriteSalesMessageOutput = z.infer<typeof RewriteSalesMessageOutputSchema>;

/**
 * An AI flow that rewrites a sales message for different tones and strategies.
 *
 * @param {RewriteSalesMessageInput} input - The input data for the rewrite.
 * @returns {Promise<RewriteSalesMessageOutput>} A promise that resolves with the rewritten message variations.
 */
export async function rewriteSalesMessage(
  input: RewriteSalesMessageInput
): Promise<RewriteSalesMessageOutput> {
  return rewriteSalesMessageFlow(input);
}

const rewriteSalesMessagePrompt = ai.definePrompt({
  name: 'rewriteSalesMessagePrompt',
  input: { schema: RewriteSalesMessageInputSchema },
  output: { schema: RewriteSalesMessageOutputSchema },
  prompt: `You are an expert real estate sales coach and copywriter. Your task is to rewrite a sales message to make it more effective, based on a specific tone or strategy requested by the user. Generate 3-5 distinct variations.

  **Original Message:**
  "{{{originalMessage}}}"

  **Requested Tone/Strategy:**
  "{{{tone}}}"

  **Instructions:**

  1.  **Analyze the Goal:** First, understand the implied goal of the original message (e.g., scheduling a viewing, re-engaging a cold lead, announcing a price).
  2.  **Apply the Strategy:** Rewrite the message to align with the requested 'tone'.
        *   For 'More Professional', use formal language and a clear structure.
        *   For 'More Friendly & Casual', use a conversational, approachable tone.
        *   For 'Create Urgency', add elements of scarcity or time-sensitivity (e.g., "This property is getting a lot of attention...").
        *   For 'More Persuasive', focus on benefits and emotional appeal.
        *   For 'Shorten & Simplify', make the message as concise and clear as possible.
  3.  **Generate Variations:** Create 3-5 different versions. For each version, briefly state the specific 'strategy' you applied in that rewrite (e.g., "Focused on benefits," "Added a specific call-to-action," "Simplified the opening").
  4.  **Keep it WhatsApp-Friendly:** Ensure the messages are appropriate for a WhatsApp chat context—clear, relatively short, and easy to read on mobile.

  Return the rewritten message variations in the specified output format.
  `,
});


const rewriteSalesMessageFlow = ai.defineFlow(
  {
    name: 'rewriteSalesMessageFlow',
    inputSchema: RewriteSalesMessageInputSchema,
    outputSchema: RewriteSalesMessageOutputSchema,
  },
  async (input) => {
    const { output } = await rewriteSalesMessagePrompt(input);
    if (!output) {
        throw new Error("The AI failed to rewrite the message.");
    }
    return output;
  }
);
