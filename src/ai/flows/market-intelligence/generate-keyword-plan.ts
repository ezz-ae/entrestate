'use server';

/**
 * @fileOverview An AI flow to generate a strategic keyword plan for Google Ads.
 *
 * This flow acts as an expert SEM strategist, taking a topic and location,
 * and returning a comprehensive plan including ad groups, keyword variations,
 * and negative keywords.
 *
 * @module AI/Flows/GenerateKeywordPlan
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * Defines the schema for the input of the keyword plan generation flow.
 */
const GenerateKeywordPlanInputSchema = z.object({
  topic: z.string().describe('The central topic or product for the keyword plan (e.g., "luxury villas in Dubai Hills").'),
  targetLocation: z.string().describe('The geographical target for the ads (e.g., "Dubai, UAE").'),
});
export type GenerateKeywordPlanInput = z.infer<typeof GenerateKeywordPlanInputSchema>;


const KeywordSchema = z.object({
    keyword: z.string().describe('The specific keyword phrase.'),
    matchType: z.enum(['Broad', 'Phrase', 'Exact']).describe('The match type for the keyword.'),
    monthlySearches: z.number().describe('An estimated monthly search volume.'),
    competition: z.enum(['Low', 'Medium', 'High']).describe('The estimated competition level.'),
});

const AdGroupSchema = z.object({
    adGroupName: z.string().describe('The logical name for the ad group (e.g., "Branded Terms", "Location-Based Search").'),
    keywords: z.array(KeywordSchema).describe('A list of keywords belonging to this ad group.'),
});

/**
 * Defines the schema for the output of the keyword plan generation flow.
 */
const GenerateKeywordPlanOutputSchema = z.object({
  planTitle: z.string().describe('A descriptive title for the overall keyword plan.'),
  adGroups: z.array(AdGroupSchema).describe('A list of logically grouped ad groups with their keywords.'),
  negativeKeywords: z.array(z.string()).describe('A list of recommended negative keywords to exclude.'),
});
export type GenerateKeywordPlanOutput = z.infer<typeof GenerateKeywordPlanOutputSchema>;


const generateKeywordPlanPrompt = ai.definePrompt({
  name: 'generateKeywordPlanPrompt',
  input: {schema: GenerateKeywordPlanInputSchema},
  output: {schema: GenerateKeywordPlanOutputSchema},
  prompt: `You are an expert Google Ads strategist specializing in real estate. Your task is to create a comprehensive keyword plan for a search campaign.

  **Topic:** {{{topic}}}
  **Target Location:** {{{targetLocation}}}

  **Instructions:**

  1.  **Develop a Plan Title:** Create a clear title for the plan.
  2.  **Create Logical Ad Groups:** Generate 2-4 distinct ad groups based on the topic. Examples could include "Branded Terms" (if a brand is mentioned), "Location-Specific," "Feature-Specific," or "Competitor Terms."
  3.  **Populate Keywords:** For each ad group, generate a list of relevant keywords.
      *   For each keyword, provide variations for 'Broad', 'Phrase', and 'Exact' match types.
      *   Estimate a plausible 'monthlySearches' volume (e.g., 100, 500, 1500).
      *   Estimate the 'competition' level ('Low', 'Medium', 'High').
  4.  **Recommend Negative Keywords:** Provide a list of at least 5-10 essential negative keywords to prevent wasted ad spend (e.g., "jobs", "free", "cheap", "rent").

  Return a complete and professional keyword plan ready for a user to implement in their Google Ads account.
  `,
});

const generateKeywordPlanFlow = ai.defineFlow(
  {
    name: 'generateKeywordPlanFlow',
    inputSchema: GenerateKeywordPlanInputSchema,
    outputSchema: GenerateKeywordPlanOutputSchema,
  },
  async input => {
    const {output} = await generateKeywordPlanPrompt(input);
    if (!output) {
      throw new Error('The AI failed to generate a keyword plan.');
    }
    return output;
  }
);


/**
 * An AI flow that generates a keyword plan for Google Ads.
 *
 * @param {GenerateKeywordPlanInput} input - The input data for the plan.
 * @returns {Promise<GenerateKeywordPlanOutput>} A promise that resolves with the keyword plan.
 */
export async function generateKeywordPlan(
  input: GenerateKeywordPlanInput
): Promise<GenerateKeywordPlanOutput> {
  return generateKeywordPlanFlow(input);
}
