
'use server';

/**
 * @fileOverview An AI flow to generate a multi-offer comparison document.
 *
 * This flow takes multiple properties and client details and creates a
 * professional, side-by-side comparison PDF for the client.
 *
 * @module AI/Flows/GenerateMultiOffer
 *
 * @export {function} generateMultiOffer - The main function to generate the document.
 * @export {type} GenerateMultiOfferInput - The Zod schema for the input.
 * @export {type} GenerateMultiOfferOutput - The Zod schema for the output.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * Defines the schema for the input of the multi-offer generation flow.
 */
const GenerateMultiOfferInputSchema = z.object({
  properties: z.string().describe('A list of property addresses, one per line.'),
  clientInfo: z.string().describe('Basic information about the client (e.g., name, budget).'),
  terms: z.string().describe('Key offer terms to include for comparison.'),
});
export type GenerateMultiOfferInput = z.infer<typeof GenerateMultiOfferInputSchema>;

/**
 * Defines the schema for the output of the multi-offer generation flow.
 */
const GenerateMultiOfferOutputSchema = z.object({
  offerPackageDataUri: z
    .string()
    .describe(
      "The generated offer comparison PDF, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateMultiOfferOutput = z.infer<typeof GenerateMultiOfferOutputSchema>;

const generateMultiOfferPrompt = ai.definePrompt({
    name: 'generateMultiOfferPrompt',
    input: { schema: GenerateMultiOfferInputSchema },
    output: { schema: GenerateMultiOfferOutputSchema },
    model: 'gemini-1.5-pro-preview',
    prompt: `You are a real estate analyst creating a comparison document.
    Generate a professional, clean, side-by-side comparison PDF document based on the following information.
    The PDF should have a title, a brief summary for the client, and a table comparing the properties based on the specified terms.

    Client Info: {{{clientInfo}}}
    Properties:
    {{{properties}}}
    
    Terms to Compare:
    {{{terms}}}

    Return the final document as a PDF data URI.
    `
});


/**
 * An AI flow that generates a multi-offer comparison document.
 *
 * @param {GenerateMultiOfferInput} input - The input data for the document.
 * @returns {Promise<GenerateMultiOfferOutput>} A promise that resolves with the document data.
 */
export async function generateMultiOffer(input: GenerateMultiOfferInput): Promise<GenerateMultiOfferOutput> {
  return generateMultiOfferFlow(input);
}

const generateMultiOfferFlow = ai.defineFlow(
  {
    name: 'generateMultiOfferFlow',
    inputSchema: GenerateMultiOfferInputSchema,
    outputSchema: GenerateMultiOfferOutputSchema,
  },
  async (input) => {
    const { output } = await generateMultiOfferPrompt(input);
    if (!output) {
      throw new Error("Failed to generate multi-offer document.");
    }
    return output;
  }
);
