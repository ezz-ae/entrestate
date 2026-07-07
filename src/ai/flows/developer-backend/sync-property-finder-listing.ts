
'use server';

/**
 * @fileOverview An AI flow to sync a property listing with the Property Finder API.
 *
 * This flow takes structured listing data, converts it to the required XML format,
 * and pushes it to the Property Finder Enterprise API.
 *
 * @module AI/Flows/SyncPropertyFinderListing
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Builder } from 'xml2js';
import fetch from 'node-fetch';

/**
 * Zod schema for a single image URL.
 */
const ImageSchema = z.object({
    url: z.string().url().describe("A single URL for a property image.")
});

/**
 * Defines the schema for the input of the Property Finder sync flow.
 * This mirrors the fields required by the Property Finder XML structure.
 */
const SyncPropertyFinderListingInputSchema = z.object({
    listingReferenceNo: z.string().describe("The unique reference number for the listing."),
    propertyTitle: z.string().describe("The title of the property listing."),
    propertyDescription: z.string().describe("The detailed description of the property."),
    price: z.number().positive().describe("The price of the property."),
    imageUrls: z.array(z.string().url()).describe("An array of URLs for the property images."),
});

export type SyncPropertyFinderListingInput = z.infer<typeof SyncPropertyFinderListingInputSchema>;

/**
 * Defines the schema for the output of the sync flow.
 */
const SyncPropertyFinderListingOutputSchema = z.object({
    success: z.boolean().describe("Whether the API call was successful."),
    message: z.string().describe("A message from the API response."),
    referenceNumber: z.string().optional().describe("The reference number of the synced listing."),
});

export type SyncPropertyFinderListingOutput = z.infer<typeof SyncPropertyFinderListingOutputSchema>;

/**
 * The main exported function that wraps the Genkit flow.
 * @param {SyncPropertyFinderListingInput} input - The listing data to sync.
 * @returns {Promise<SyncPropertyFinderListingOutput>} The result of the sync operation.
 */
export async function syncPropertyFinderListing(
  input: SyncPropertyFinderListingInput
): Promise<SyncPropertyFinderListingOutput> {
  return syncPropertyFinderListingFlow(input);
}


const syncPropertyFinderListingFlow = ai.defineFlow(
  {
    name: 'syncPropertyFinderListingFlow',
    inputSchema: SyncPropertyFinderListingInputSchema,
    outputSchema: SyncPropertyFinderListingOutputSchema,
  },
  async (input) => {
    const apiKey = process.env.PROPERTY_FINDER_API_KEY;
    const apiEndpoint = 'https://www.propertyfinder.ae/en/api/v2/broker/upload'; // Placeholder endpoint, replace with real one

    if (!apiKey) {
      throw new Error("Property Finder API key is not configured in environment variables.");
    }

    // Construct the XML payload from the input
    const listingObject = {
      property: {
        reference_no: input.listingReferenceNo,
        title_en: input.propertyTitle,
        description_en: input.propertyDescription,
        price: input.price,
        // Assuming a static structure for simplicity. This would be more dynamic in a real app.
        property_type: 'AP', // Apartment
        listing_type: 'RS', // Residential Sales
        completion_status: 'completed',
        permit_number: '12345',
        // Map image URLs
        photos: {
            photo: input.imageUrls.map(url => ({ _: url }))
        }
      },
    };

    const builder = new Builder({ rootName: 'list' });
    const xml = builder.buildObject({ property: [listingObject.property] }); // Wrap in property array for correct list format

    try {
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/xml',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: xml,
        });

        const responseText = await response.text();

        if (!response.ok) {
            // Attempt to parse XML error response, but fall back to text
            try {
                const { parseStringPromise } = await import('xml2js');
                const errorResult = await parseStringPromise(responseText);
                throw new Error(errorResult?.response?.message || `Property Finder API Error: ${response.statusText}`);
            } catch(e) {
                 throw new Error(responseText || `Property Finder API Error: ${response.statusText}`);
            }
        }
        
      return {
        success: true,
        message: `Listing ${input.listingReferenceNo} has been successfully updated.`,
        referenceNumber: input.listingReferenceNo,
      };

    } catch (error: any) {
      console.error('Property Finder API Error:', error);
      throw new Error(`Failed to sync with Property Finder: ${error.message}`);
    }
  }
);
