
'use server';

/**
 * @fileOverview A flow that rebrands a brochure with personal details, company logo, and chosen branding elements.
 *
 * This flow takes an existing brochure and applies a new brand identity to it, including contact details,
 * a company logo (generating one if not provided), and brand-specific tone and colors.
 *
 * @export {function} rebrandBrochure - The main function to rebrand a brochure.
 * @export {type} RebrandBrochureInput - The Zod schema for the input of the rebrandBrochure flow.
 * @export {type} RebrandBrochureOutput - The Zod schema for the output of the rebrandBrochure flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

/**
 * Defines the schema for the input of the brochure rebranding flow.
 */
const RebrandBrochureInputSchema = z.object({
  /**
   * The source brochure document, encoded as a Base64 data URI.
   * @example "data:application/pdf;base64,..."
   */
  brochureDataUri: z
    .string()
    .describe(
      "A brochure document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  /**
   * The contact details to be added to the rebranded brochure.
   */
  contactDetails: z.string().describe('The contact details of the user.'),
  /**
   * The name of the user or company for the rebranding.
   */
  companyName: z.string().describe('The name of the user or company.'),
  /**
   * An optional company logo, encoded as a Base64 data URI. If not provided, a logo will be generated.
   * @example "data:image/png;base64,..."
   */
  companyLogoDataUri: z
    .string()
    .optional()
    .describe(
      "The company logo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. If not provided, a logo will be generated."
    ),
  /**
   * The desired tone of voice for the rebranded brochure.
   * @example "Professional", "Friendly"
   */
  toneOfVoice: z
    .string()
    .describe('The desired tone of voice for the brochure.'),
  /**
   * The desired color palette for the rebranded brochure.
   * @example "Blue and Silver"
   */
  colors: z.string().describe('The desired colors for the brochure.'),
  /**
   * Optional specific instructions for fine-tuning the rebranding.
   */
  deepEditInstructions: z
    .string()
    .optional()
    .describe('Optional specific instructions for deep editing.'),
});
export type RebrandBrochureInput = z.infer<typeof RebrandBrochureInputSchema>;

/**
 * Defines the schema for the output of the brochure rebranding flow.
 */
const RebrandBrochureOutputSchema = z.object({
  /**
   * The rebranded brochure, returned as a Base64 data URI.
   */
  rebrandedBrochureDataUri: z
    .string()
    .describe(
      "The rebranded brochure, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  /**
   * The generated logo, returned as a Base64 data URI. This field is only present if a logo was generated.
   */
  logoDataUri: z
    .string()
    .optional()
    .describe(
      "The generated logo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. Only present if a logo was generated."
    ),
});
export type RebrandBrochureOutput = z.infer<typeof RebrandBrochureOutputSchema>;

/**
 * An AI flow that rebrands a brochure with new branding elements.
 * This function serves as a wrapper for the underlying Genkit flow.
 *
  * @param {RebrandBrochureInput} input - The input data for rebranding the brochure.
 * @returns {Promise<RebrandBrochureOutput>} A promise that resolves with the rebranded brochure and optional generated logo.
 */
export async function rebrandBrochure(
  input: RebrandBrochureInput
): Promise<RebrandBrochureOutput> {
  return rebrandBrochureFlow(input);
}

const rebrandBrochurePrompt = ai.definePrompt({
  name: 'rebrandBrochurePrompt',
  input: {schema: z.object({
      ...RebrandBrochureInputSchema.shape,
      // The prompt needs the potentially generated logo
      generatedLogoDataUri: z.string().optional(),
  })},
  output: {schema: RebrandBrochureOutputSchema},
  prompt: `You are an expert marketing assistant specializing in rebranding brochures.

You will rebrand the brochure provided with the user's contact details, company logo, and chosen branding elements.

Use the following information to rebrand the brochure:

Contact Details: {{{contactDetails}}}
Company Name: {{{companyName}}}
Company Logo: {{#if companyLogoDataUri}}{{media url=companyLogoDataUri}}{{else}}{{#if generatedLogoDataUri}}{{media url=generatedLogoDataUri}}{{else}}No logo provided or generated.{{/if}}{{/if}}
Tone of Voice: {{{toneOfVoice}}}
Colors: {{{colors}}}

Brochure: {{media url=brochureDataUri}}

{{#if deepEditInstructions}}
Deep Edit Instructions: Apply these specific changes carefully:
{{{deepEditInstructions}}}
{{/if}}

Output the rebranded brochure as a data URI.
`,
});

const generateLogoFlow = ai.defineFlow(
  {
    name: 'generateLogo',
    inputSchema: z.object({
      companyName: z.string().describe('The name of the company.'),
      colors: z.string().describe('The desired colors for the brochure.'),
    }),
    outputSchema: z.object({
      logoDataUri: z.string().describe(
        "The generated logo, as a data URI."
      ),
    }),
  },
  async (input) => {
    const { media } = await ai.generate({
      model: googleAI.model('imagen-4.0-fast-generate-001'),
      prompt: `Create a clean, professional, minimalist logo for a real estate company named "${input.companyName}". Use a color palette of ${input.colors}. The logo should be on a transparent background.`
    });
    if (!media?.url) throw new Error("Failed to generate a logo image.");
    return { logoDataUri: media.url };
  }
);


const rebrandBrochureFlow = ai.defineFlow(
  {
    name: 'rebrandBrochureFlow',
    inputSchema: RebrandBrochureInputSchema,
    outputSchema: RebrandBrochureOutputSchema,
  },
  async (input) => {
    let logoToUse = input.companyLogoDataUri;
    let generatedLogoUri: string | undefined = undefined;

    const shouldGenerateLogo = !input.companyLogoDataUri && (input.deepEditInstructions?.toLowerCase().includes("logo") || !input.companyLogoDataUri);

    if (shouldGenerateLogo) {
      const logoResult = await generateLogoFlow({
        companyName: input.companyName,
        colors: input.colors,
      });
      generatedLogoUri = logoResult.logoDataUri;
      logoToUse = generatedLogoUri;
    }
    
    const promptPayload = {
      ...input,
      generatedLogoDataUri: generatedLogoUri,
    };

    const { output } = await rebrandBrochurePrompt(promptPayload);

    if (!output) {
      throw new Error("Failed to generate rebranded brochure.");
    }
    
    return {
      rebrandedBrochureDataUri: output.rebrandedBrochureDataUri,
      logoDataUri: generatedLogoUri,
    };
  }
);
