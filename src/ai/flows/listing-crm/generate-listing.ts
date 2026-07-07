
'use server';

/**
 * @fileOverview AI flow to generate compelling real estate listing descriptions.
 *
 * This flow takes property details and generates a persuasive, SEO-friendly description
 * suitable for platforms like Property Finder and Bayut.
 *
 * @module AI/Flows/GenerateListing
 *
 * @export {function} generateListing - The main function to generate a listing.
 * @export {type} GenerateListingInput - The Zod schema for the input of the flow.
 * @export {type} GenerateListingOutput - The Zod schema for the output of the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * Defines the schema for the input of the listing generation flow.
 */
const GenerateListingInputSchema = z.object({
  platform: z.string().describe("The listing platform (e.g., 'Property Finder', 'Bayut')."),
  propertyAddress: z.string().describe('The full address of the property.'),
  keyDetails: z.string().describe('Basic stats like beds, baths, and square footage.'),
  uniqueFeatures: z.string().describe('What makes this property special. Separate features with a comma or newline.'),
  tone: z.enum(['Luxury', 'Family-Friendly', 'Modern', 'Cozy', 'Urgent']).describe('The desired tone for the listing description.'),
});
export type GenerateListingInput = z.infer<typeof GenerateListingInputSchema>;

/**
 * Defines the schema for the output of the listing generation flow.
 */
const GenerateListingOutputSchema = z.object({
  title: z.string().describe("A compelling, SEO-friendly title for the listing."),
  description: z.string().describe('The full, persuasive listing description.'),
  keywords: z.array(z.string()).describe("A list of suggested keywords for the listing platform."),
});
export type GenerateListingOutput = z.infer<typeof GenerateListingOutputSchema>;

/**
 * An AI flow that generates a real estate listing description.
 * This function serves as a wrapper for the underlying Genkit flow.
 *
 * @param {GenerateListingInput} input - The input data for generating the listing.
 * @returns {Promise<GenerateListingOutput>} A promise that resolves with the generated listing content.
 */
export async function generateListing(
  input: GenerateListingInput
): Promise<GenerateListingOutput> {
  return generateListingFlow(input);
}

const generateListingPrompt = ai.definePrompt({
  name: 'generateListingPrompt',
  input: {schema: GenerateListingInputSchema},
  output: {schema: GenerateListingOutputSchema},
  prompt: `You are an expert real estate copywriter specializing in creating high-performing listings for the Dubai market on platforms like {{{platform}}}.

  **Platform:** {{{platform}}}
  **Property Address:** {{{propertyAddress}}}
  **Key Details:** {{{keyDetails}}}
  **Unique Features:** {{{uniqueFeatures}}}
  **Tone:** {{{tone}}}

  **Instructions:**

  1.  **Create a Compelling Title:** Write a headline that is both captivating and rich with keywords buyers would search for.
  2.  **Write a Persuasive Description:** Craft a narrative-driven property description. Start with a hook, detail the unique features, describe the lifestyle, and end with a clear call-to-action.
  3.  **Generate Keywords:** Provide a list of 5-7 powerful keywords that should be added to the listing on the specified platform to maximize visibility.
  `,
});

const generateListingFlow = ai.defineFlow(
  {
    name: 'generateListingFlow',
    inputSchema: GenerateListingInputSchema,
    outputSchema: GenerateListingOutputSchema,
  },
  async input => {
    const {output} = await generateListingPrompt(input);
    if (!output) {
      throw new Error('Failed to generate listing content.');
    }
    return output;
  }
);
