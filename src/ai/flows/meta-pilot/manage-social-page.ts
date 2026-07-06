
'use server';

/**
 * @fileOverview An AI flow to act as a social media page admin.
 *
 * This flow can schedule posts, respond to common questions, and flag
 * high-intent comments for personal review.
 *
 * @module AI/Flows/ManageSocialPage
 *
 * @export {function} manageSocialPage - The main function to manage a social page.
 * @export {type} ManageSocialPageInput - The Zod schema for the input.
 * @export {type} ManageSocialPageOutput - The Zod schema for the output.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * Defines the schema for the input of the page admin flow.
 */
const ManageSocialPageInputSchema = z.object({
  task: z
    .string()
    .describe(
      'The management task to perform (e.g., "Draft 3 engaging replies to a comment asking about price", "Create a content schedule for next week").'
    ),
  context: z
    .string()
    .optional()
    .describe(
      'Any relevant context, such as the text of a comment or the topic for a content schedule.'
    ),
});
export type ManageSocialPageInput = z.infer<typeof ManageSocialPageInputSchema>;

/**
 * Defines the schema for the output of the page admin flow.
 */
const ManageSocialPageOutputSchema = z.object({
  status: z.string().describe('A status update on the performed task.'),
  result: z
    .string()
    .describe(
      'The output of the task, such as drafted replies or a content schedule.'
    ),
});
export type ManageSocialPageOutput = z.infer<typeof ManageSocialPageOutputSchema>;

const manageSocialPagePrompt = ai.definePrompt({
  name: 'manageSocialPagePrompt',
  input: {schema: ManageSocialPageInputSchema},
  output: {schema: ManageSocialPageOutputSchema},
  prompt: `You are a highly experienced real estate sales professional with 25 years in the industry, now acting as an expert social media manager. Your job is to handle administrative tasks with the insight and authority of a seasoned agent.

  **Task:** {{{task}}}
  {{#if context}}
  **Context:** {{{context}}}
  {{/if}}

  Perform the requested task and provide a clear output. For example, if asked to draft replies, provide 3 distinct options that are both helpful and strategically aimed at converting a lead. If asked to create a schedule, ensure the content provides value and builds authority.
  `,
});

const manageSocialPageFlow = ai.defineFlow(
  {
    name: 'manageSocialPageFlow',
    inputSchema: ManageSocialPageInputSchema,
    outputSchema: ManageSocialPageOutputSchema,
  },
  async input => {
    const {output} = await manageSocialPagePrompt(input);
    if (!output) {
      throw new Error('The AI failed to perform the social media task.');
    }
    return output;
  }
);

/**
 * An AI flow that performs social media admin tasks.
 *
 * @param {ManageSocialPageInput} input - The input data for the task.
 * @returns {Promise<ManageSocialPageOutput>} A promise that resolves with a status.
 */
export async function manageSocialPage(
  input: ManageSocialPageInput
): Promise<ManageSocialPageOutput> {
  return manageSocialPageFlow(input);
}
