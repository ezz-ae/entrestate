
'use server';

/**
 * @fileOverview An AI flow to translate a brochure into a specified language.
 *
 * This flow takes a source brochure document and a target language, then returns
 * a new, translated version of the brochure, aiming to preserve the original
 * layout and design.
 *
 * @export {function} translateBrochure - The main function to translate a brochure.
 * @export {type} TranslateBrochureInput - The Zod schema for the input.
 * @export {type} TranslateBrochureOutput - The Zod schema for the output.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * Defines the schema for the input of the brochure translation flow.
 */
const TranslateBrochureInputSchema = z.object({
  /**
   * The source brochure document, encoded as a Base64 data URI.
   * @example "data:application/pdf;base64,..."
   */
  brochureDataUri: z
    .string()
    .describe(
      "The source brochure document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  /**
   * The target language for the translation.
   */
  targetLanguage: z
    .string()
    .describe('The language to translate the brochure into (e.g., "Arabic", "Chinese").'),
});
export type TranslateBrochureInput = z.infer<typeof TranslateBrochureInputSchema>;

/**
 * Defines the schema for the output of the brochure translation flow.
 */
const TranslateBrochureOutputSchema = z.object({
  /**
   * The translated brochure document, returned as a Base64 data URI.
   */
  translatedBrochureDataUri: z
    .string()
    .describe(
      "The translated brochure document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TranslateBrochureOutput = z.infer<typeof TranslateBrochureOutputSchema>;


/**
 * An AI flow that translates a brochure into a specified language.
 *
 * @param {TranslateBrochureInput} input - The input data for the translation.
 * @returns {Promise<TranslateBrochureOutput>} A promise that resolves with the translated brochure.
 */
export async function translateBrochure(
  input: TranslateBrochureInput
): Promise<TranslateBrochureOutput> {
  return translateBrochureFlow(input);
}


const translateBrochurePrompt = ai.definePrompt({
  name: 'translateBrochurePrompt',
  input: {schema: TranslateBrochureInputSchema},
  output: {schema: TranslateBrochureOutputSchema},
  prompt: `You are an expert document translator and designer. Your task is to translate the provided brochure into the specified target language while preserving the original layout, formatting, and design as closely as possible.

  **Target Language:** {{{targetLanguage}}}
  
  **Source Brochure:**
  {{media url=brochureDataUri}}

  Instructions:
  1.  Translate all text content accurately into the target language.
  2.  Maintain the original font styles, sizes, and colors.
  3.  Keep all images and logos in their original positions.
  4.  Ensure the layout of the translated text flows correctly within the existing design, adjusting font sizes slightly if necessary to fit the space.
  
  Return the fully translated document as a new PDF data URI.
  `,
});


const translateBrochureFlow = ai.defineFlow(
  {
    name: 'translateBrochureFlow',
    inputSchema: TranslateBrochureInputSchema,
    outputSchema: TranslateBrochureOutputSchema,
  },
  async input => {
    const {output} = await translateBrochurePrompt(input);
    if (!output) {
      throw new Error('The AI failed to translate the brochure.');
    }
    return output;
  }
);
