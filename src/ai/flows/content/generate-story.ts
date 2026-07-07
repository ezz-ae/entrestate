
'use server';

/**
 * @fileOverview An AI flow to generate an animated social media story from project assets.
 *
 * This flow takes a project ID and a desired vibe, and creates a short, engaging
 * video story suitable for platforms like Instagram or Facebook.
 *
 * @export {function} generateStory - The main function to generate a story.
 * @export {type} GenerateStoryInput - The Zod schema for the input of the generateStory flow.
 * @export {type} GenerateStoryOutput - The Zod schema for the output of the generateStory flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

/**
 * Defines the schema for the input of the story generation flow.
 */
const GenerateStoryInputSchema = z.object({
  projectId: z.string().describe('The ID of the project to use for photo assets.'),
  vibe: z.string().describe('The desired vibe for the story (e.g., "Modern", "Luxury").'),
  callToAction: z.string().describe('The call to action text for the end of the story.'),
});
export type GenerateStoryInput = z.infer<typeof GenerateStoryInputSchema>;

/**
 * Defines the schema for the output of the story generation flow.
 */
const GenerateStoryOutputSchema = z.object({
  storyVideoDataUri: z
    .string()
    .describe(
      "The generated story video, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateStoryOutput = z.infer<typeof GenerateStoryOutputSchema>;

/**
 * An AI flow that generates an animated social media story.
 *
 * @param {GenerateStoryInput} input - The input data for generating the story.
 * @returns {Promise<GenerateStoryOutput>} A promise that resolves with the generated story video data.
 */
export async function generateStory(input: GenerateStoryInput): Promise<GenerateStoryOutput> {
  return generateStoryFlow(input);
}

// Helper to fetch and encode the video
async function getVideoDataUri(videoUrl: string): Promise<string> {
    const fetch = (await import('node-fetch')).default;
    const apiKey = process.env.GEMINI_API_KEY || process.env.VERTEX_AI_API_KEY;
    if (!apiKey) throw new Error("API key is missing.");

    const videoDownloadResponse = await fetch(`${videoUrl}&key=${apiKey}`);
    if (!videoDownloadResponse.ok) {
        throw new Error(`Failed to download video: ${videoDownloadResponse.statusText}`);
    }
    const videoBuffer = await videoDownloadResponse.arrayBuffer();
    return `data:video/mp4;base64,${Buffer.from(videoBuffer).toString('base64')}`;
}

const generateStoryFlow = ai.defineFlow(
  {
    name: 'generateStoryFlow',
    inputSchema: GenerateStoryInputSchema,
    outputSchema: GenerateStoryOutputSchema,
  },
  async input => {
    // In a real app, you would fetch project images based on input.projectId
    let { operation } = await ai.generate({
      model: googleAI.model('veo-2.0-generate-001'),
      prompt: `Create a short, animated social media story for a real estate project. The video should be vertical (9:16) and about 15 seconds long.
      
      Project: ${input.projectId}
      Vibe: ${input.vibe}
      Final Call to Action: "${input.callToAction}"

      Animate a sequence of 3-5 high-quality, realistic images of a luxury apartment with modern transitions and elegant text overlays. The final frame should feature the call to action prominently.
      `,
      config: {
        aspectRatio: '9:16',
      }
    });

    if (!operation) throw new Error("Video generation did not return an operation.");

    while(!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.checkOperation(operation);
    }
    
    if (operation.error) throw new Error(`Video generation failed: ${operation.error.message}`);
    
    const video = operation.output?.message?.content.find(p => !!p.media);
    if (!video || !video.media?.url) throw new Error("Generated video not found in operation result.");

    const videoDataUri = await getVideoDataUri(video.media.url);

    return {
      storyVideoDataUri: videoDataUri,
    };
  }
);
