
'use server';

/**
 * @fileOverview An AI flow to create a customizable, embeddable chatbot for a website.
 *
 * This flow takes basic information about a project and generates an HTML/JS snippet
 * that users can paste into their website to deploy an AI-powered assistant.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define the input schema for creating the chatbot
const ChatbotCreatorInputSchema = z.object({
  projectName: z.string().describe('The name of the project the chatbot will represent.'),
  welcomeMessage: z.string().optional().describe('A custom welcome message for the chatbot.'),
  primaryColor: z.string().optional().describe('The primary color for the chatbot widget (hex code).'),
  allowedDomains: z.array(z.string()).optional().describe('A list of domains where the chatbot is allowed to run.'),
});
export type ChatbotCreatorInput = z.infer<typeof ChatbotCreatorInputSchema>;

// Define the output schema, which will be the embed code
const ChatbotCreatorOutputSchema = z.object({
  embedCode: z.string().describe('The HTML and JavaScript snippet to embed the chatbot on a website.'),
  previewUrl: z.string().optional().describe('A URL to a standalone page to preview the chatbot.'),
});
export type ChatbotCreatorOutput = z.infer<typeof ChatbotCreatorOutputSchema>;


const chatbotCreatorPrompt = ai.definePrompt({
  name: 'chatbotCreatorPrompt',
  input: { schema: ChatbotCreatorInputSchema },
  output: { schema: ChatbotCreatorOutputSchema },
  prompt: `
    You are an expert web developer creating an embeddable chatbot script.
    Based on the following user requirements, generate a clean, self-contained HTML/JS snippet.

    **Project Name:** {{{projectName}}}
    **Welcome Message:** {{{welcomeMessage}}}
    **Primary Color:** {{{primaryColor}}}
    **Allowed Domains:** {{#if allowedDomains}}{{{allowedDomains}}}{{else}}Any{{/if}}

    **Instructions:**
    1.  Create an HTML snippet that includes a button to open the chat window and a container for the chat interface.
    2.  Write JavaScript to handle the chat functionality:
        - Toggling the chat window's visibility.
        - Sending messages to a mock backend (for this simulation).
        - Displaying user and bot messages in the chat interface.
        - The bot's first message should be the welcome message.
    3.  Use the provided primary color to style the chat widget's header and send button.
    4.  The entire code should be wrapped in a single string for the 'embedCode' output field.
    5.  Do not include any real API keys or backend logic; simulate the chat interaction on the client side.
  `,
});


export const chatbotCreatorFlow = ai.defineFlow(
  {
    name: 'chatbotCreatorFlow',
    inputSchema: ChatbotCreatorInputSchema,
    outputSchema: ChatbotCreatorOutputSchema,
  },
  async (input) => {
    
    // In a real scenario, this would call the prompt. For this simulation,
    // we'll generate a plausible-looking script directly to ensure it's valid.
    const primaryColor = input.primaryColor || '#007bff';
    const welcomeMessage = input.welcomeMessage || `Welcome to ${input.projectName}! How can I help you today?`;

    const embedCode = `
<!-- Start Entrestate Chatbot -->
<div id="entrestate-chatbot-container"></div>
<script>
  (function() {
    const config = {
      projectName: "${input.projectName}",
      welcomeMessage: "${welcomeMessage}",
      primaryColor: "${primaryColor}",
      allowedDomains: ${JSON.stringify(input.allowedDomains || [])}
    };

    // --- Create CSS ---
    const style = document.createElement('style');
    style.innerHTML = \`
      #entrestate-chat-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: \${config.primaryColor};
        color: white;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        border: none;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9998;
      }
      #entrestate-chat-window {
        position: fixed;
        bottom: 90px;
        right: 20px;
        width: 350px;
        height: 500px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        border-radius: 15px;
        overflow: hidden;
        display: none;
        flex-direction: column;
        background-color: white;
        z-index: 9999;
      }
      .chat-header {
        background-color: \${config.primaryColor};
        color: white;
        padding: 15px;
        font-family: sans-serif;
        font-weight: bold;
      }
      .chat-body {
        flex: 1;
        padding: 10px;
        overflow-y: auto;
      }
      .chat-footer {
        padding: 10px;
        border-top: 1px solid #eee;
        display: flex;
      }
      .chat-footer input {
        flex: 1;
        border: 1px solid #ddd;
        border-radius: 20px;
        padding: 8px 12px;
        font-size: 14px;
      }
      .chat-footer button {
        background-color: \${config.primaryColor};
        border: none;
        color: white;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        margin-left: 8px;
        cursor: pointer;
      }
    \`;
    document.head.appendChild(style);

    // --- Create HTML ---
    const container = document.getElementById('entrestate-chatbot-container');
    if (!container) return;

    container.innerHTML = \`
      <button id="entrestate-chat-button">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1z"/><path d="M15 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1z"/><path d="M12 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1z"/></svg>
      </button>
      <div id="entrestate-chat-window">
        <div class="chat-header">Chat with \${config.projectName}</div>
        <div class="chat-body" id="chat-body"></div>
        <div class="chat-footer">
          <input type="text" id="chat-input" placeholder="Type a message...">
          <button id="chat-send">➤</button>
        </div>
      </div>
    \`;

    // --- Add Logic ---
    const chatButton = document.getElementById('entrestate-chat-button');
    const chatWindow = document.getElementById('entrestate-chat-window');
    const chatBody = document.getElementById('chat-body');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('chat-send');

    chatButton.addEventListener('click', () => {
      chatWindow.style.display = chatWindow.style.display === 'flex' ? 'none' : 'flex';
    });

    const addMessage = (text, from) => {
        const msgDiv = document.createElement('div');
        msgDiv.style.marginBottom = '10px';
        msgDiv.style.textAlign = from === 'user' ? 'right' : 'left';
        
        const msgBubble = document.createElement('div');
        msgBubble.textContent = text;
        msgBubble.style.display = 'inline-block';
        msgBubble.style.padding = '8px 12px';
        msgBubble.style.borderRadius = '15px';
        msgBubble.style.backgroundColor = from === 'user' ? config.primaryColor : '#f1f1f1';
        msgBubble.style.color = from === 'user' ? 'white' : 'black';
        
        msgDiv.appendChild(msgBubble);
        chatBody.appendChild(msgDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }
    
    addMessage(config.welcomeMessage, 'bot');

    const handleSend = () => {
        const text = chatInput.value;
        if (!text.trim()) return;
        addMessage(text, 'user');
        chatInput.value = '';
        
        // Simulate bot response
        setTimeout(() => {
            addMessage("I'm an AI assistant. I'm learning to answer questions about " + config.projectName + ". For now, please contact a human agent for details!", 'bot');
        }, 1000);
    }
    sendButton.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend() });

  })();
</script>
<!-- End Entrestate Chatbot -->
    `;

    return { embedCode };
  }
);
