
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Schema for a single day's post
const DailyPostSchema = z.object({
  day: z.string().describe("e.g., Monday, Tuesday"),
  postText: z.string().describe("The full text for the social media post."),
  imageSuggestion: z.string().describe("A specific, compelling image suggestion to visually complement the text."),
});

// Schema for the hashtag strategy
const HashtagStrategySchema = z.object({
  primary: z.array(z.string()).describe("5-7 high-volume, broad-appeal hashtags."),
  secondary: z.array(z.string()).describe("5-7 niche-specific hashtags related to the source content."),
  location: z.array(z.string()).describe("3-5 hashtags for the specific city or neighborhood."),
});

// Input schema for the flow
const InstagramContentCreatorInputSchema = z.object({
  topic: z.string().describe("The central topic, property name, or URL to base the content on."),
  platform: z.enum(['Instagram', 'Facebook', 'LinkedIn', 'X']).default('Instagram').describe("The target social media platform."),
});
export type InstagramContentCreatorInput = z.infer<typeof InstagramContentCreatorInputSchema>;


// Output schema for the flow
const InstagramContentCreatorOutputSchema = z.object({
  posts: z.array(DailyPostSchema).describe("A unique, engaging post for each day of the week (Monday to Sunday)."),
  hashtagStrategy: HashtagStrategySchema,
});
export type InstagramContentCreatorOutput = z.infer<typeof InstagramContentCreatorOutputSchema>;


const instagramContentCreatorPrompt = ai.definePrompt({
    name: 'instagramContentCreatorPrompt',
    input: { schema: InstagramContentCreatorInputSchema },
    output: { schema: InstagramContentCreatorOutputSchema },
    prompt: `
      You are an expert real estate social media strategist. Your task is to generate a complete, one-week social media content plan for the {{{platform}}} platform based on the provided source content.

      **Source Content / Topic:**
      {{{topic}}}

      **Instructions:**

      1.  **Weekly Content Plan:** Generate a unique, engaging post for each day of the week (Monday to Sunday) and place it in the 'posts' output field. Each post should offer a different angle or highlight a different aspect of the source content.
      2.  **Image Suggestions:** For each daily post, provide a specific and compelling image suggestion that would visually complement the text.
      3.  **Hashtag Strategy:** Create a comprehensive hashtag strategy divided into three tiers:
          *   **Primary:** 5-7 high-volume, broad-appeal hashtags relevant to real estate and the platform.
          *   **Secondary:** 5-7 niche-specific hashtags related to the source content (e.g., #luxurycondo, #firsttimebuyer).
          *   **Location:** 3-5 hashtags for the specific city or neighborhood mentioned or implied in the source (e.g., #miamirealestate, #downtownliving).
      
      Structure the output to be a complete, ready-to-use strategy for a busy real estate professional.
    `
});


// The Genkit Flow
export const instagramContentCreatorFlow = ai.defineFlow(
  {
    name: 'instagramContentCreatorFlow',
    inputSchema: InstagramContentCreatorInputSchema,
    outputSchema: InstagramContentCreatorOutputSchema,
  },
  async (input) => {
    const { output } = await instagramContentCreatorPrompt(input);
    if (!output) {
      throw new Error("The AI failed to generate a valid social media plan.");
    }
    return output;
  }
);
