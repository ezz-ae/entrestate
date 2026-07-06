
'use server';

/**
 * @fileOverview An AI flow to generate authentic, user-generated content (UGC) style video scripts.
 *
 * This flow takes a topic and a desired vibe and generates short, conversational scripts
 * optimized for platforms like TikTok and Instagram Reels.
 *
 * @export {function} ugcScriptWriter - The main function to generate UGC scripts.
 * @export {type} UgcScriptWriterInput - The Zod schema for the input.
 * @export {type} UgcScriptWriterOutput - The Zod schema for the output.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

/**
 * Defines the schema for the input of the UGC script writer flow.
 */
const UgcScriptWriterInputSchema = z.object({
  topic: z.string().describe('The subject of the video (e.g., a property, a market trend, a service).'),
  vibe: z.string().describe('The desired tone and style of the script (e.g., "Exciting & Upbeat", "Authentic & Relatable", "Luxurious & Exclusive").'),
  hookStyle: z.string().describe('The style of the opening hook to grab attention (e.g., "Question-based", "Problem/Solution", "Surprising Stat").'),
});
export type UgcScriptWriterInput = z.infer<typeof UgcScriptWriterInputSchema>;

/**
 * Defines the schema for the output of the UGC script writer flow.
 */
const UgcScriptWriterOutputSchema = z.object({
  scripts: z.array(
    z.object({
      hook: z.string().describe("The opening line designed to capture attention."),
      body: z.string().describe("The main content of the script, written in a conversational style."),
      callToAction: z.string().describe("The closing line that tells the viewer what to do next."),
    })
  ).describe("A list of 3 distinct script variations."),
});
export type UgcScriptWriterOutput = z.infer<typeof UgcScriptWriterOutputSchema>;


/**
 * An AI flow that generates UGC-style video scripts.
 *
 * @param {UgcScriptWriterInput} input - The input data for the script generation.
 * @returns {Promise<UgcScriptWriterOutput>} A promise that resolves with the generated scripts.
 */
export async function ugcScriptWriter(
  input: UgcScriptWriterInput
): Promise<UgcScriptWriterOutput> {
  return ugcScriptWriterFlow(input);
}


const ugcScriptWriterPrompt = ai.definePrompt({
  name: 'ugcScriptWriterPrompt',
  input: { schema: UgcScriptWriterInputSchema },
  output: { schema: UgcScriptWriterOutputSchema },
  prompt: `You are an expert social media scriptwriter specializing in short-form, user-generated content (UGC) style videos for real estate. Your task is to generate 3 distinct, compelling script variations based on the user's topic and desired style.

  **Topic:** {{{topic}}}
  **Vibe:** {{{vibe}}}
  **Hook Style:** {{{hookStyle}}}

  **Instructions:**

  1.  **Generate 3 Variations:** Create three complete, distinct script options.
  2.  **UGC Style:** Write in a natural, conversational, and authentic tone. Use short sentences. Avoid corporate jargon.
  3.  **Structure:** For each script, provide a clear:
      *   **Hook:** A powerful opening line (1-3 seconds) that matches the requested 'Hook Style'.
      *   **Body:** The main part of the script (15-45 seconds) that explains the topic.
      *   **Call to Action (CTA):** A clear and direct instruction at the end.
  4.  **Keep it Concise:** The entire script should be suitable for a video under 60 seconds.

  Return the 3 script variations in the specified output format.
  `,
});


const ugcScriptWriterFlow = ai.defineFlow(
  {
    name: 'ugcScriptWriterFlow',
    inputSchema: UgcScriptWriterInputSchema,
    outputSchema: UgcScriptWriterOutputSchema,
  },
  async (input) => {
    const { output } = await ugcScriptWriterPrompt(input);
    if (!output) {
      throw new Error('The AI failed to generate scripts.');
    }
    return output;
  }
);
