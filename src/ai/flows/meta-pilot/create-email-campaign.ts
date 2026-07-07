
'use server';

/**
 * @fileOverview An AI flow to design, write, and schedule an email campaign.
 *
 * This flow takes a campaign goal and a source topic/URL and generates a
 * sequence of emails ready to be sent.
 *
 * @module AI/Flows/CreateEmailCampaign
 *
 * @export {function} createEmailCampaign - The main function to create a campaign.
 * @export {type} CreateEmailCampaignInput - The Zod schema for the input.
 * @export {type} CreateEmailCampaignOutput - The Zod schema for the output.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * Defines the schema for the input of the email campaign creation flow.
 */
const CreateEmailCampaignInputSchema = z.object({
  goal: z
    .string()
    .describe(
      'The goal of the campaign (e.g., "New Listing Announcement", "Open House Follow-up").'
    ),
  source: z
    .string()
    .describe(
      'A URL or topic to use as the content basis (e.g., a property listing page, a market report topic).'
    ),
  tone: z
    .string()
    .describe('The desired tone of voice for the emails (e.g., "Professional & Urgent").'),
});
export type CreateEmailCampaignInput = z.infer<
  typeof CreateEmailCampaignInputSchema
>;

/**
 * Defines the schema for the output of the email campaign creation flow.
 */
const CreateEmailCampaignOutputSchema = z.object({
  emails: z
    .array(
      z.object({
        subject: z.string().describe("The email's subject line."),
        bodyHtml: z.string().describe('The full HTML content of the email.'),
        sendDelayDays: z
          .number()
          .describe(
            'The number of days to wait before sending this email (e.g., 0 for immediate, 2 for two days later).'
          ),
      })
    )
    .describe('A sequence of generated emails for the campaign.'),
});
export type CreateEmailCampaignOutput = z.infer<
  typeof CreateEmailCampaignOutputSchema
>;

const createEmailCampaignPrompt = ai.definePrompt({
  name: 'createEmailCampaignPrompt',
  input: {schema: CreateEmailCampaignInputSchema},
  output: {schema: CreateEmailCampaignOutputSchema},
  prompt: `You are an expert email marketing strategist for the real estate industry. Your task is to create a complete email campaign based on the user's goal.

  **Campaign Goal:** {{{goal}}}
  **Content Source/Topic:** {{{source}}}
  **Tone of Voice:** {{{tone}}}

  **Instructions:**

  1.  **Determine the Sequence:** Based on the goal, decide if a single email or a multi-part sequence (e.g., a 3-part drip campaign) is more appropriate.
  2.  **Craft Compelling Content:** For each email in the sequence:
      *   Write a high-impact, engaging subject line.
      *   Write the full email body in clean, professional HTML. Use paragraphs, bold text, and bullet points to make it readable.
      *   Ensure the content is tailored to the source topic and the desired tone.
  3.  **Set the Schedule:** Define the send delay for each email in days. The first email should always have a delay of 0.

  Return a complete campaign structure that is ready to be implemented.
  `,
});

const createEmailCampaignFlow = ai.defineFlow(
  {
    name: 'createEmailCampaignFlow',
    inputSchema: CreateEmailCampaignInputSchema,
    outputSchema: CreateEmailCampaignOutputSchema,
  },
  async input => {
    const {output} = await createEmailCampaignPrompt(input);
    if (!output) {
      throw new Error('Failed to generate email campaign.');
    }
    return output;
  }
);

/**
 * An AI flow that creates an email campaign.
 *
 * @param {CreateEmailCampaignInput} input - The input data for the campaign.
 * @returns {Promise<CreateEmailCampaignOutput>} A promise that resolves with the campaign emails.
 */
export async function createEmailCampaign(
  input: CreateEmailCampaignInput
): Promise<CreateEmailCampaignOutput> {
  return createEmailCampaignFlow(input);
}
