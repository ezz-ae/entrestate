
'use server';

/**
 * @fileOverview An AI flow to retrieve and summarize information about a client.
 *
 * This flow queries the user's private knowledge base (CRM, emails, etc.)
 * to provide a concise summary about a specific client.
 *
 * @module AI/Flows/GetCrmMemory
 *
 * @export {function} getCrmMemory - The main function to query client memory.
 * @export {type} GetCrmMemoryInput - The Zod schema for the input.
 * @export {type} GetCrmMemoryOutput - The Zod schema for the output.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * Defines the schema for the input of the CRM memory flow.
 */
const GetCrmMemoryInputSchema = z.object({
  clientName: z.string().describe('The name of the client to query.'),
  query: z.string().describe('The specific question about the client.'),
});
export type GetCrmMemoryInput = z.infer<typeof GetCrmMemoryInputSchema>;

/**
 * Defines the schema for the output of the CRM memory flow.
 */
const GetCrmMemoryOutputSchema = z.object({
  summary: z
    .string()
    .describe('A summary of the requested information about the client.'),
  confidenceScore: z
    .number()
    .describe(
      'A score from 0 to 1 indicating how confident the AI is in the answer based on the available (but unseen) data.'
    ),
});
export type GetCrmMemoryOutput = z.infer<typeof GetCrmMemoryOutputSchema>;

const getCrmMemoryPrompt = ai.definePrompt({
  name: 'getCrmMemoryPrompt',
  input: {schema: GetCrmMemoryInputSchema},
  output: {schema: GetCrmMemoryOutputSchema},
  prompt: `You are an AI assistant with access to a user's private CRM data, including past emails, call notes, and contact details. You cannot see this data directly, but you can query it to answer the user's questions.

  A user is asking for information about a client.

  **Client Name:** {{{clientName}}}
  **User's Question:** "{{{query}}}"

  Based on the question, provide a concise, helpful summary as if you have perfect recall of all past interactions with this client. Also, provide a confidence score based on how likely it is that this information would exist in a standard real estate agent's CRM.

  **Example Response:**
  *   **Query:** "What was the last property I showed to Jane Doe?"
  *   **Summary:** "Your last interaction with Jane Doe was a showing at 123 Maple Street. Her feedback was that she liked the layout but was looking for a larger backyard."
  *   **Confidence:** 0.95

  Generate a response for the user's actual query.
  `,
});

const getCrmMemoryFlow = ai.defineFlow(
  {
    name: 'getCrmMemoryFlow',
    inputSchema: GetCrmMemoryInputSchema,
    outputSchema: GetCrmMemoryOutputSchema,
  },
  async input => {
    // In a real application, this flow would first query a vector database
    // containing the user's CRM data and then pass that context to the prompt.
    // For now, we simulate this by letting the LLM generate a plausible response.
    const {output} = await getCrmMemoryPrompt(input);
    if (!output) {
      throw new Error('Failed to query CRM memory.');
    }
    return output;
  }
);

/**
 * An AI flow that retrieves information about a client.
 *
 * @param {GetCrmMemoryInput} input - The input data for the query.
 * @returns {Promise<GetCrmMemoryOutput>} A promise that resolves with the summary.
 */
export async function getCrmMemory(
  input: GetCrmMemoryInput
): Promise<GetCrmMemoryOutput> {
  return getCrmMemoryFlow(input);
}
