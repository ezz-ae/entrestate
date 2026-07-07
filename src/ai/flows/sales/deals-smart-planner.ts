
'use server';

/**
 * @fileOverview An AI flow that acts as a strategic deal planner for real estate agents.
 *
 * This flow takes a user's goal and context, and generates a series of actionable
 * steps to help them close a deal. It's designed to be interactive and conversational.
 *
 * @module AI/Flows/Sales/DealsSmartPlanner
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

/**
 * Defines the schema for the input of the Deals Smart Planner flow.
 */
const DealsSmartPlannerInputSchema = z.object({
  goal: z.string().describe('The user\'s primary objective, e.g., "Plan a deal", "Follow up on a lead".'),
  userContext: z.string().optional().describe('Information about the user\'s current situation or a previous step\'s result.'),
  userStrengths: z.array(z.string()).optional().describe('A list of the user\'s skills or assets, e.g., "strong on TikTok", "speaks Chinese", "has a large WhatsApp contact list".'),
});
export type DealsSmartPlannerInput = z.infer<typeof DealsSmartPlannerInputSchema>;

/**
 * Defines the schema for a single step in the generated plan.
 */
const PlanStepSchema = z.object({
    type: z.enum(['question', 'action', 'suggestion']).describe("The type of step: a question to the user, a direct action to take, or a suggestion to consider."),
    title: z.string().describe("A short, clear title for the step."),
    description: z.string().describe("A detailed explanation of the step and the reasoning behind it."),
    actionable_item: z.string().optional().describe("A specific piece of content for the user to use, like an SMS message body, a video script, or a subject line."),
    tool_id: z.string().optional().describe("The ID of a platform tool that can be used to complete this step."),
});

/**
 * Defines the schema for the output of the Deals Smart Planner flow.
 */
const DealsSmartPlannerOutputSchema = z.object({
  nextStep: PlanStepSchema.describe("The next logical step for the user to take in their deal plan."),
});
export type DealsSmartPlannerOutput = z.infer<typeof DealsSmartPlannerOutputSchema>;

/**
 * An AI flow that acts as a strategic partner to plan real estate deals.
 *
 * @param {DealsSmartPlannerInput} input - The input data for the planner.
 * @returns {Promise<DealsSmartPlannerOutput>} A promise that resolves with the next step in the plan.
 */
export async function dealsSmartPlanner(
  input: DealsSmartPlannerInput
): Promise<DealsSmartPlannerOutput> {
  return dealsSmartPlannerFlow(input);
}

const dealsSmartPlannerPrompt = ai.definePrompt({
  name: 'dealsSmartPlannerPrompt',
  input: { schema: DealsSmartPlannerInputSchema },
  output: { schema: DealsSmartPlannerOutputSchema },
  prompt: `You are a world-class real estate marketing and sales strategist, acting as an AI agent for a user on the Entrestate platform. Your goal is to create a single, actionable next step to help the user achieve their goal.

  **User Goal:** "{{{goal}}}"

  **User's Strengths/Assets:**
  {{#if userStrengths}}
  {{#each userStrengths}}
  - {{{this}}}
  {{/each}}
  {{else}}
  - Standard (Phone, Email)
  {{/if}}

  **Current Context / Previous Step:**
  "{{{userContext}}}"

  **Your Task:**
  Based on the user's goal, their strengths, and the current context, determine the **single best next step**.

  1.  **If you need more information,** ask a clear question ('question' type).
        *   Example: If goal is "follow up", ask "Do you have a lead that has gone cold? Or is this a new lead?"

  2.  **If you have enough information,** propose a concrete action ('action' type).
        *   Provide a title, a description explaining the strategy, and a specific 'actionable_item' (like an SMS to copy or a script to read).
        *   If a tool on the platform can help, specify its 'tool_id'.
        *   Example 1: If context is "cold lead named John", propose: { type: 'action', title: 'Send a Re-engagement SMS', description: 'This message is designed to be low-pressure and re-open the conversation.', actionable_item: 'Hey John, just saw a property with [Feature] and thought of you. No pressure, but wanted to check if you were still in the market. Let me know.' }
        *   Example 2: If user is strong on TikTok, propose: { type: 'action', title: 'Create a 10-second Teaser Video', description: 'Leverage your TikTok presence with a quick, intriguing video.', actionable_item: 'You won't believe what just hit the market in Dubai Hills...', tool_id: 'tiktok-editor' }

  3.  **If the user is asking for ideas,** give a high-level suggestion ('suggestion' type).
        *   Example: If goal is "tell me something to do", propose: { type: 'suggestion', title: 'Analyze Top Performing Listings', description: 'Let\'s look at what is selling fast in your focus area to find a new angle for your marketing.', tool_id: 'listing-performance' }

  Now, generate ONLY the JSON for the single best 'nextStep'.
  `,
});


const dealsSmartPlannerFlow = ai.defineFlow(
  {
    name: 'dealsSmartPlannerFlow',
    inputSchema: DealsSmartPlannerInputSchema,
    outputSchema: DealsSmartPlannerOutputSchema,
  },
  async (input) => {
    // In a real scenario, we might fetch userStrengths from their profile
    const finalInput = {
        ...input,
        userStrengths: input.userStrengths || ['Phone', 'Email', 'Social Media (Meta)']
    };
    const { output } = await dealsSmartPlannerPrompt(finalInput);
    if (!output) {
        throw new Error("The AI failed to generate a plan step.");
    }
    return output;
  }
);
