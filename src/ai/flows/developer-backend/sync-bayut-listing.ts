
'use server';

/**
 * @fileOverview An AI flow to sync a property listing with the Bayut API.
 *
 * This flow takes structured listing data, converts it to the required JSON format,
 * and pushes it to the Bayut API.
 *
 * @module AI/Flows/SyncBayutListing
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import fetch from 'node-fetch';


/**
 * Defines the schema for the input of the Bayut sync flow.
 * This mirrors the fields required by the Bayut API.
 */
const SyncBayutListingInputSchema = z.object({
    listingReferenceNo: z.string().describe("The unique reference number for the listing."),
    propertyTitle: z.string().describe("The title of the property listing."),
    propertyDescription: z.string().describe("The detailed description of the property."),
    propertyType: z.string().optional().describe("e.g., 'Apartment', 'Villa', 'Townhouse'"),
    price: z.number().positive().describe("The price of the property."),
    size: z.number().optional().describe("The size of the property in square feet."),
    bedrooms: z.number().optional().describe("The number of bedrooms."),
    bathrooms: z.number().optional().describe("The number of bathrooms."),
    amenities: z.string().optional().describe("A comma-separated list of amenities."),
    imageUrls: z.array(z.string().url()).describe("An array of URLs for the property images."),
});

export type SyncBayutListingInput = z.infer<typeof SyncBayutListingInputSchema>;

/**
 * Defines the schema for the output of the sync flow.
 */
const SyncBayutListingOutputSchema = z.object({
    success: z.boolean().describe("Whether the API call was successful."),
    message: z.string().describe("A message from the API response."),
    referenceNumber: z.string().optional().describe("The reference number of the synced listing."),
});

export type SyncBayutListingOutput = z.infer<typeof SyncBayutListingOutputSchema>;

/**
 * The main exported function that wraps the Genkit flow.
 * @param {SyncBayutListingInput} input - The listing data to sync.
 * @returns {Promise<SyncBayutListingOutput>} The result of the sync operation.
 */
export async function syncBayutListing(
  input: SyncBayutListingInput
): Promise<SyncBayutListingOutput> {
  return syncBayutListingFlow(input);
}


const syncBayutListingFlow = ai.defineFlow(
  {
    name: 'syncBayutListingFlow',
    inputSchema: SyncBayutListingInputSchema,
    outputSchema: SyncBayutListingOutputSchema,
  },
  async (input) => {
    const apiKey = process.env.BAYUT_API_KEY;
    const apiEndpoint = 'https://api.bayut.com/v1/properties'; // Placeholder endpoint, replace with real one

    if (!apiKey) {
      throw new Error("Bayut API key is not configured in environment variables.");
    }

    // Construct the JSON payload from the input, including new optional fields
    const listingPayload = {
      reference: input.listingReferenceNo,
      title_en: input.propertyTitle,
      description_en: input.propertyDescription,
      price: input.price,
      category_id: 1, // Residential - this would be dynamic in a real app
      property_type: input.propertyType,
      size: input.size,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      amenities: input.amenities?.split(',').map(a => a.trim()).filter(Boolean),
      status: 'active',
      permit_number: '12345',
      images: input.imageUrls.map(url => ({ url }))
    };

    // Make the API call to Bayut
    try {
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(listingPayload),
        });

        const responseData = await response.json() as any;

        if (!response.ok) {
            throw new Error(responseData.message || `Bayut API Error: ${response.statusText}`);
        }

      return {
        success: response.ok,
        message: responseData.message || `Listing ${input.listingReferenceNo} has been successfully created/updated on Bayut.`,
        referenceNumber: responseData.data?.reference || input.listingReferenceNo,
      };

    } catch (error: any) {
      console.error('Bayut API Error:', error);
      throw new Error(`Failed to sync with Bayut: ${error.message}`);
    }
  }
);
