'use server';

/**
 * @fileOverview The workspace AI co-pilot behind /api/chat and /me/assistant.
 *
 * A grounded conversational assistant for Entrestate real-estate professionals.
 * It answers in the platform's voice and, when the user is trying to DO
 * something, points them at the real tool that does it (by title) rather than
 * pretending to perform actions it cannot. Returns a plain spoken-style reply.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'genkit';
import { tools } from '@/lib/tools-data';

const AssistantChatInputSchema = z.object({
  query: z.string(),
  history: z
    .array(z.object({ role: z.enum(['user', 'model']), text: z.string() }))
    .optional(),
});
export type AssistantChatInput = z.infer<typeof AssistantChatInputSchema>;

const AssistantChatOutputSchema = z.object({
  text: z.string().describe('The assistant reply in a helpful, concise voice.'),
  suggestedToolId: z
    .string()
    .optional()
    .describe('If the user is trying to do something, the id of the tool that does it.'),
});
export type AssistantChatOutput = z.infer<typeof AssistantChatOutputSchema>;

const assistantPrompt = ai.definePrompt({
  name: 'assistantChatPrompt',
  input: {
    schema: z.object({
      query: z.string(),
      history: z.array(z.object({ role: z.enum(['user', 'model']), text: z.string() })),
      tools: z.array(z.object({ id: z.string(), title: z.string() })),
    }),
  },
  output: { schema: AssistantChatOutputSchema },
  model: googleAI.model('gemini-2.5-flash'),
  prompt: `You are the AI co-pilot inside Entrestate, an AI-native real estate platform for
professionals in the Dubai/UAE market. Be concise, practical, and honest.

You cannot perform actions yourself, but the platform has real tools the user can open.
When the user wants to DO or CREATE something (an ad, a brochure rebrand, a market report,
a listing, a campaign…), pick the single most relevant tool from this list and set
suggestedToolId to its id; in your reply, name the tool and say you've lined it up for them.
For questions, answer helpfully from general Dubai real-estate knowledge and be clear about
what you do and don't know. Never invent specific prices, inventory, or guarantees.

Available tools:
{{#each tools}}- {{this.id}} : "{{this.title}}"
{{/each}}

Conversation so far:
{{#each history}}{{this.role}}: {{{this.text}}}
{{/each}}
user: {{{query}}}

Reply now.`,
});

export async function assistantChat(input: AssistantChatInput): Promise<AssistantChatOutput> {
  const { output } = await assistantPrompt({
    query: input.query,
    history: (input.history || []).slice(-10),
    tools: tools.map((t) => ({ id: t.id, title: t.title })),
  });
  if (!output) throw new Error('The assistant could not generate a reply.');
  return output;
}
