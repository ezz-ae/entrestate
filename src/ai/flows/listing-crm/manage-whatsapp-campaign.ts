
'use server';

/**
 * @fileOverview An AI flow to manage a WhatsApp broadcast or drip campaign.
 *
 * This flow sends personalized messages to a list of contacts via WhatsApp.
 *
 * @module AI/Flows/ManageWhatsAppCampaign
 *
 * @export {function} manageWhatsAppCampaign - The main function to manage a campaign.
 * @export {type} ManageWhatsAppCampaignInput - The Zod schema for the input.
 * @export {type} ManageWhatsAppCampaignOutput - The Zod schema for the output.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * Defines the schema for the input of the WhatsApp campaign management flow.
 */
const ManageWhatsAppCampaignInputSchema = z.object({
  contactsDataUri: z
    .string()
    .describe(
      "A CSV of contacts, as a data URI. It must include 'name' and 'phone' columns."
    ),
  campaignType: z
    .string()
    .describe(
      'The type of campaign (e.g., "New Listing Announcement", "Open House Follow-up").'
    ),
  context: z
    .string()
    .describe(
      'Provide the necessary context, like the property name or open house date.'
    ),
});
export type ManageWhatsAppCampaignInput = z.infer<
  typeof ManageWhatsAppCampaignInputSchema
>;

/**
 * Defines the schema for the output of the WhatsApp campaign management flow.
 */
const ManageWhatsAppCampaignOutputSchema = z.object({
  status: z
    .string()
    .describe(
      'A status update on the campaign (e.g., "Message template generated and ready to send").'
    ),
  messageTemplate: z
    .string()
    .describe(
      'The generated, personalized message template. Use [Name] to represent the contact\'s name.'
    ),
});
export type ManageWhatsAppCampaignOutput = z.infer<
  typeof ManageWhatsAppCampaignOutputSchema
>;

const manageWhatsAppCampaignPrompt = ai.definePrompt({
  name: 'manageWhatsAppCampaignPrompt',
  input: {schema: ManageWhatsAppCampaignInputSchema},
  output: {schema: ManageWhatsAppCampaignOutputSchema},
  prompt: `You are an expert in WhatsApp marketing for real estate. Your task is to draft a friendly, professional, and effective message template for a campaign.

  **Campaign Type:** {{{campaignType}}}
  **Context:** {{{context}}}
  **Contacts File:** {{media url=contactsDataUri}}

  Analyze the campaign type and context, then write a personalized message template. Use the placeholder "[Name]" where the contact's name should go. Keep the message concise and include a clear call-to-action.

  **Example:**
  *   **Campaign Type:** "New Listing Announcement"
  *   **Context:** "Azure Lofts, a new luxury condo in Downtown."
  *   **Message Template:** "Hi [Name]! Just wanted to let you know about a stunning new luxury condo project called Azure Lofts that just launched in Downtown. Would you be interested in seeing the brochure? Let me know!"

  Now, generate the message template for the user's request.
  `,
});

const manageWhatsAppCampaignFlow = ai.defineFlow(
  {
    name: 'manageWhatsAppCampaignFlow',
    inputSchema: ManageWhatsAppCampaignInputSchema,
    outputSchema: ManageWhatsAppCampaignOutputSchema,
  },
  async input => {
    const {output} = await manageWhatsAppCampaignPrompt(input);
    if (!output) {
      throw new Error('The AI failed to generate a WhatsApp message template.');
    }
    // In a real application, this flow would also connect to the Twilio API
    // and loop through the contacts to send the message.
    return {
      status: `Message template generated for ${output.status}. Ready to send.`,
      messageTemplate: output.messageTemplate,
    };
  }
);

/**
 * An AI flow that manages a WhatsApp campaign.
 *
 * @param {ManageWhatsAppCampaignInput} input - The input data for the campaign.
 * @returns {Promise<ManageWhatsAppCampaignOutput>} A promise that resolves with the campaign status.
 */
export async function manageWhatsAppCampaign(
  input: ManageWhatsAppCampaignInput
): Promise<ManageWhatsAppCampaignOutput> {
  return manageWhatsAppCampaignFlow(input);
}
