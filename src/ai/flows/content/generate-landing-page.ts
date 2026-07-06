
'use server';

/**
 * @fileOverview AI flow to generate a landing page for a specific project based on project details and user branding.
 *
 * This flow generates the HTML for a complete landing page, incorporating project details,
 * user branding preferences, and information from an optional brochure. It also generates
 * headline and call-to-action strategies in the same call.
 *
 * @export {function} generateLandingPage - The main function to generate a landing page.
 * @export {type} GenerateLandingPageInput - The Zod schema for the input of the generateLandingPage flow.
 * @export {type} GenerateLandingPageOutput - The Zod schema for the output of the generateLandingPage flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * Defines the schema for the input of the landing page generation flow.
 */
const GenerateLandingPageInputSchema = z.object({
  /**
   * The name of the project.
   */
  projectName: z.string().describe('The name of the project.'),
  /**
   * Detailed information about the project.
   */
  projectDetails: z
    .string()
    .describe('Detailed information about the project.'),
  /**
   * The chosen visual style or template for the landing page.
   */
  brandingStyle: z
    .string()
    .optional()
    .describe(
      'A comma-separated string of chosen visual styles for the landing page (e.g., "Modern & Minimalist, Luxury & Elegant").'
    ),
  /**
   * The number of content sections to include in the page.
   */
  numberOfSections: z.number().min(2).max(5).optional().describe('The number of content sections to generate (2-5).'),
  /**
   * An optional project brochure, encoded as a Base64 data URI.
   * @example "data:application/pdf;base64,..."
   */
  projectBrochureDataUri: z
    .string()
    .optional()
    .describe(
      "A project brochure, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  /**
   * An optional custom domain for the landing page.
   */
  customDomain: z.string().optional().describe('The custom domain for the landing page (e.g., my-awesome-project.com).'),
   /**
   * An optional path for the landing page URL.
   */
  path: z.string().optional().describe('The path for the landing page URL (e.g., /exclusive-offer).'),
});
export type GenerateLandingPageInput = z.infer<
  typeof GenerateLandingPageInputSchema
>;

/**
 * Defines the schema for the output of the landing page generation flow.
 */
const GenerateLandingPageOutputSchema = z.object({
  /**
   * The generated HTML content for the landing page.
   */
  landingPageHtml: z
    .string()
    .describe('The generated HTML content for the landing page.'),
   /**
   * The final URL for the published page.
   */
  publishUrl: z.string().optional().describe('The final URL for the published page.'),
  /**
   * A list of suggested headline strategies.
   */
  headlineOptions: z.array(z.object({
      id: z.string(),
      strategy: z.string().describe('The name of the strategy (e.g., "Urgency Focused").'),
      headline: z.string().describe('The suggested headline.'),
      cta: z.string().describe('The suggested call to action text.'),
  })).describe("A list of 3-5 distinct headline and CTA strategies."),
});
export type GenerateLandingPageOutput = z.infer<
  typeof GenerateLandingPageOutputSchema
>;

/**
 * An AI flow that generates the HTML for a landing page.
 * This function serves as a wrapper for the underlying Genkit flow.
 *
 * @param {GenerateLandingPageInput} input - The input data for generating the landing page.
 * @returns {Promise<GenerateLandingPageOutput>} A promise that resolves with the generated landing page HTML and strategies.
 */
export async function generateLandingPage(
  input: GenerateLandingPageInput
): Promise<GenerateLandingPageOutput> {
  return generateLandingPageFlow(input);
}


const landingPagePrompt = ai.definePrompt({
  name: 'landingPagePrompt',
  input: {schema: GenerateLandingPageInputSchema },
  output: {schema: GenerateLandingPageOutputSchema},
  prompt: `You are an expert web developer and marketing strategist specializing in high-converting real estate landing pages. Your task is to generate a complete, single-file HTML document using Tailwind CSS, AND a set of marketing strategies for the page's headline and Call-to-Action (CTA).

  **Project Details:**
  - Project Name: {{{projectName}}}
  - Offer Details: {{{projectDetails}}}
  - Domain: {{#if customDomain}}{{{customDomain}}}{{else}}Not specified{{/if}}
  - Path: {{#if path}}{{{path}}}{{else}}/{{/if}}
  
  **Branding & Content:**
  - Branding Style(s): {{{brandingStyle}}}
  - Desired Page Structure: Create a page with {{{numberOfSections}}} main sections.
  {{#if projectBrochureDataUri}}
  - Project Brochure: {{media url=projectBrochureDataUri}}
  {{/if}}

  **Instructions:**

  1.  **Generate Headline Strategies (headlineOptions):** First, devise 3 distinct strategies for the main headline and call-to-action (CTA). For each strategy, provide a unique ID, a name (e.g., "Urgency-Focused", "Luxury-Focused", "Benefit-Focused"), a compelling headline, and a clear call-to-action.
  
  2.  **Generate Landing Page HTML (landingPageHtml):** Create a full HTML5 document for the landing page. For the hero section, use the *first* headline strategy you generated as the default.
      -   **HTML Structure:** Create a full HTML5 document structure (\`<!DOCTYPE html>\`, \`<html>\`, \`<head>\`, \`<body>\`).
      -   **SEO & Metadata**: In the \`<head>\`, include a compelling \`<title>\` tag and relevant meta tags (description, og:title, og:description).
      -   **Tailwind CSS:** Use the Tailwind CSS CDN script in the \`<head>\` for styling: \`<script src="https://cdn.tailwindcss.com"></script>\`.
      -   **Hero Section:** Create a visually impressive hero section using a high-quality placeholder image from picsum.photos. It must feature the headline and CTA from your **first** generated strategy. Use a class 'cta-button' for the main call-to-action link.
      -   **Content Sections:** Based on the 'numberOfSections' parameter, build out the page (Hero, Key Features, Gallery, Location, Lead Form). Use placeholder images from picsum.photos.
      -   **Lead Capture Form:** This is critical. Include a prominent lead capture form with fields for Name, Email, and Phone Number.
      -   **Branding:** Ensure the design reflects the specified 'Branding Style(s)'.

  3.  **Output:** Return ONLY the complete JSON object containing both the 'headlineOptions' array and the 'landingPageHtml' string. Do not include any other explanations or markdown.
  `,
});

const generateLandingPageFlow = ai.defineFlow(
  {
    name: 'generateLandingPageFlow',
    inputSchema: GenerateLandingPageInputSchema,
    outputSchema: GenerateLandingPageOutputSchema,
  },
  async input => {
    const {output} = await landingPagePrompt(input);
    if (!output || !output.landingPageHtml || !output.headlineOptions) {
      throw new Error('Failed to generate landing page content and strategies.');
    }

    const domain = input.customDomain || 'example.com';
    const path = input.path || '';
    const publishUrl = `https://${domain}${path}`;
    
    return {
        landingPageHtml: output.landingPageHtml,
        headlineOptions: output.headlineOptions,
        publishUrl: publishUrl,
    };
  }
);
