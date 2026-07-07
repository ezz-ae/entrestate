
'use server';

/**
 * @fileOverview An AI flow to analyze a user's text input and route it to the appropriate action.
 *
 * This flow determines if the user's query is a command to run a tool, a question to be searched,
 * or a statement to be posted. It acts as the central router for the main workspace input.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { tools } from '@/lib/tools-data';

// Dynamically generate the list of tool titles for the schema
const toolTitles = tools.map(t => t.title);

const SmartInputRouterInputSchema = z.object({
  query: z.string().describe("The user's text input from the main workspace command bar."),
});
export type SmartInputRouterInput = z.infer<typeof SmartInputRouterInputSchema>;

const SmartInputRouterOutputSchema = z.object({
  intent: z.enum(['Search', 'Command', 'Post']).describe("The AI's classification of the user's intent."),
  toolId: z.string().optional().describe("If the intent is 'Command', this is the ID of the most relevant tool to run."),
  reasoning: z.string().describe("A brief explanation of why the AI chose this intent and/or tool."),
});
export type SmartInputRouterOutput = z.infer<typeof SmartInputRouterOutputSchema>;

const smartInputRouterPrompt = ai.definePrompt({
  name: 'smartInputRouterPrompt',
  input: { schema: z.object({
    query: z.string(),
    tools: z.array(z.object({ id: z.string(), title: z.string() }))
  })},
  output: { schema: SmartInputRouterOutputSchema },
  prompt: `
    You are an expert intent router for a real estate AI platform. Your job is to analyze a user's query and decide the most appropriate action.

    The user's query is: "{{{query}}}"

    You have three possible intents to choose from:
    1.  **Search**: Use this for questions, requests for information, or queries about projects, areas, or market data. (e.g., "What is the price of Emaar Beachfront?", "downtown dubai 3br apartments")
    2.  **Command**: Use this when the user is asking to *do* or *create* something. If you choose this intent, you MUST also identify the best tool to accomplish the task from the list below. (e.g., "create an ad for my new listing", "rebrand this brochure", "generate a market report")
    3.  **Post**: Use this for general statements, opinions, or anything that seems like it should be shared with a community. (e.g., "Just closed a major deal!", "I think the market is heading up.")

    Here is the list of available tools (and their titles) you can assign for a 'Command' intent:
    {{#each tools}}
    - Tool ID: {{this.id}}, Title: "{{this.title}}"
    {{/each}}

    Analyze the user's query and determine the best intent. If the intent is a 'Command', pick the single most relevant toolId. Provide your reasoning.
  `,
});


export async function smartInputRouter(input: SmartInputRouterInput): Promise<SmartInputRouterOutput> {
    const { output } = await smartInputRouterPrompt({ 
        ...input,
        // Pass the list of tools into the prompt context
        tools: tools.map(t => ({ id: t.id, title: t.title })) 
    });

    if (!output) {
      throw new Error("The AI failed to analyze the input.");
    }
    return output;
}
