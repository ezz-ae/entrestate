
'use server';

/**
 * @fileOverview An AI flow to generate a clear, client-friendly payment plan for a real estate property.
 *
 * This flow takes project and pricing details and generates a structured payment plan,
 * which can be customized based on common UAE market structures (e.g., post-handover).
 *
 * @module AI/Flows/GeneratePaymentPlan
 *
 * @export {function} generatePaymentPlan - The main function to create a payment plan.
 * @export {type} GeneratePaymentPlanInput - The Zod schema for the input.
 * @export {type} GeneratePaymentPlanOutput - The Zod schema for the output.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * Defines the schema for the input of the payment plan generation flow.
 */
const GeneratePaymentPlanInputSchema = z.object({
  projectId: z
    .string()
    .describe('The ID of the project from the user\'s library.'),
  totalPrice: z.number().positive().describe('The total price of the property in AED.'),
  planType: z
    .string()
    .describe(
      'The desired structure of the payment plan (e.g., "Standard", "Post-Handover").'
    ),
});
export type GeneratePaymentPlanInput = z.infer<
  typeof GeneratePaymentPlanInputSchema
>;

/**
 * Defines the schema for a single payment milestone.
 */
const MilestoneSchema = z.object({
  milestone: z.string().describe('The name of the payment milestone (e.g., "Down Payment", "On Handover").'),
  date: z.string().describe('The estimated date for the payment (e.g., "On Booking", "Dec 2025").'),
  amount: z.number().describe('The amount due for this milestone in AED.'),
  percentage: z.string().describe('The percentage of the total price for this milestone (e.g., "10%").'),
});

/**
 * Defines the schema for the output of the payment plan generation flow.
 */
const GeneratePaymentPlanOutputSchema = z.object({
  planName: z.string().describe('A descriptive name for the generated plan.'),
  planDescription: z
    .string()
    .describe('A brief, client-friendly description of how the plan works.'),
  milestones: z
    .array(MilestoneSchema)
    .describe('A list of the payment milestones.'),
});
export type GeneratePaymentPlanOutput = z.infer<
  typeof GeneratePaymentPlanOutputSchema
>;

const generatePaymentPlanPrompt = ai.definePrompt({
  name: 'generatePaymentPlanPrompt',
  input: {schema: GeneratePaymentPlanInputSchema},
  output: {schema: GeneratePaymentPlanOutputSchema},
  prompt: `You are an expert real estate financial planner for the UAE market. Your task is to create a clear, simple, and professional payment plan for a client.

  **Project Data (Fictional - use for context):**
  - Project ID: {{{projectId}}}
  - Project Name: Emaar Beachfront
  - Estimated Handover: Q4 2026

  **Client Request:**
  - Total Property Price: AED {{{totalPrice}}}
  - Desired Plan Type: {{{planType}}}

  **Instructions:**

  1.  **Create a Plan Name:** Give the plan a clear name, e.g., "Emaar Beachfront - Standard 20/80 Plan".
  2.  **Write a Description:** Briefly explain the plan in simple terms for the client.
  3.  **Generate Milestones:** Based on the plan type and total price, create a logical sequence of payment milestones.
      *   Each milestone needs a clear name, an estimated date, the AED amount, and the percentage of the total price.
      *   For a 'Standard' plan, assume a structure like 10% on booking, 70% during construction, and 20% on handover.
      *   For a 'Post-Handover' plan, assume something like 10% on booking, 40% during construction, 10% on handover, and 40% over 2 years post-handover.
      *   For 'Construction-Linked', create milestones tied to construction progress (e.g., "On 20% construction", "On 40% construction").
      *   For 'Flexible (AI Suggestion)', create a unique but logical plan that would be attractive to a buyer in the Dubai market.
  4.  **Ensure Accuracy:** The sum of all milestone amounts must equal the total property price. The sum of percentages must equal 100%.

  Return a complete and accurate payment plan structure.
  `,
});

const generatePaymentPlanFlow = ai.defineFlow(
  {
    name: 'generatePaymentPlanFlow',
    inputSchema: GeneratePaymentPlanInputSchema,
    outputSchema: GeneratePaymentPlanOutputSchema,
  },
  async input => {
    // In a real application, you would fetch real project data using the input.projectId
    const {output} = await generatePaymentPlanPrompt(input);
    if (!output) {
      throw new Error('Failed to generate payment plan.');
    }
    return output;
  }
);

/**
 * An AI flow that creates a real estate payment plan.
 *
 * @param {GeneratePaymentPlanInput} input - The input data for the plan.
 * @returns {Promise<GeneratePaymentPlanOutput>} A promise that resolves with the payment plan.
 */
export async function generatePaymentPlan(
  input: GeneratePaymentPlanInput
): Promise<GeneratePaymentPlanOutput> {
  return generatePaymentPlanFlow(input);
}
