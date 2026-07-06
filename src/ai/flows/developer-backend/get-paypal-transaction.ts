
'use server';

/**
 * @fileOverview A Genkit tool to fetch transaction details from the PayPal API.
 *
 * This flow acts as a secure tool that can be called by other AI agents
 * to retrieve information about a specific PayPal transaction.
 *
 * @module AI/Flows/GetPaypalTransaction
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import fetch from 'node-fetch';

/**
 * Defines the input schema for the PayPal transaction tool.
 */
const GetPaypalTransactionInputSchema = z.object({
  transactionId: z.string().describe('The ID of the PayPal transaction to retrieve.'),
});
export type GetPaypalTransactionInput = z.infer<typeof GetPaypalTransactionInputSchema>;

/**
 * Defines the output schema for the PayPal transaction tool.
 * This is a simplified schema for demonstration.
 */
const GetPaypalTransactionOutputSchema = z.object({
  id: z.string(),
  status: z.string(),
  amount: z.object({
    currency_code: z.string(),
    value: z.string(),
  }),
  payer: z.object({
    email_address: z.string(),
    name: z.object({
      given_name: z.string(),
      surname: z.string(),
    }),
  }),
  create_time: z.string(),
});
export type GetPaypalTransactionOutput = z.infer<typeof GetPaypalTransactionOutputSchema>;


// Type for the PayPal API response
type PaypalOrderResponse = {
    id: string;
    status: string;
    purchase_units: {
        amount: {
            currency_code: string;
            value: string;
        };
    }[];
    payer: {
        email_address: string;
        name: {
            given_name: string;
            surname: string;
        };
    };
    create_time: string;
};

// Type for the PayPal Auth response
type PaypalAuthResponse = {
    access_token: string;
};


/**
 * Main function to fetch PayPal transaction details.
 * @param {GetPaypalTransactionInput} input - The transaction ID.
 * @returns {Promise<GetPaypalTransactionOutput>} The transaction details.
 */
export async function getPaypalTransaction(
  input: GetPaypalTransactionInput
): Promise<GetPaypalTransactionOutput> {
  return getPaypalTransactionFlow(input);
}

// Helper function to get PayPal access token
async function getPayPalAccessToken(clientId: string, clientSecret: string): Promise<string> {
    const response = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
        },
        body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`PayPal Auth Error: ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json() as PaypalAuthResponse;
    return data.access_token;
}


const getPaypalTransactionFlow = ai.defineFlow(
  {
    name: 'getPaypalTransactionFlow',
    inputSchema: GetPaypalTransactionInputSchema,
    outputSchema: GetPaypalTransactionOutputSchema,
  },
  async ({ transactionId }) => {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('PayPal API credentials are not configured in environment variables.');
    }
    
    try {
        const accessToken = await getPayPalAccessToken(clientId, clientSecret);
        const response = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${transactionId}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`PayPal API Error: ${response.statusText} - ${errorBody}`);
        }

        const data = await response.json() as PaypalOrderResponse;
        
        // Map the PayPal response to our output schema
        return {
            id: data.id,
            status: data.status,
            amount: {
                currency_code: data.purchase_units[0]?.amount.currency_code,
                value: data.purchase_units[0]?.amount.value,
            },
            payer: {
                email_address: data.payer.email_address,
                name: {
                    given_name: data.payer.name.given_name,
                    surname: data.payer.name.surname,
                }
            },
            create_time: data.create_time,
        };

    } catch (error: any) {
        console.error('PayPal Transaction Error:', error);
        throw new Error(`Failed to fetch PayPal transaction: ${error.message}`);
    }
  }
);
