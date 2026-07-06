# Entrestate — AI-Native Real Estate Ecosystem

**Entrestate is an AI-native operating system designed to give real estate professionals an unparalleled advantage.** It's not just a collection of tools; it's an intelligent ecosystem that unifies market intelligence, creative tooling, and campaign automation into a single, seamless cockpit.

The core mission is to solve the industry's fragmentation problem. Professionals waste countless hours on manual tasks, wrestling with disconnected tools and incomplete data. Entrestate automates the tedious work—like ad creation, brochure rebranding, and market analysis—and transforms chaotic data into clear, actionable insights. This frees up agents, marketers, and developers to focus on what they do best: building relationships and closing deals.

![Executive Brain Map](https://firebasestorage.googleapis.com/v0/b/mtcmartechgooodstage-456-326b5.appspot.com/o/executive_brain_map.png?alt=media&token=167a5704-ca13-43e6-997c-9b73715d31f0)

*A high-level diagram of our AI-native architecture. See the full SVG in `src/components/diagrams/ExecutiveBrainMap.tsx` and read the detailed explanation in `src/ai/PRODUCT_BRIEF.md`.*

---

## Products & Business

Entrestate sells the platform as focused products — entitlement cuts of one
codebase, each with a demo-led AI sales funnel. The map lives in
[docs/README.md](./docs/README.md):

-   **[AI Voice Landing Pages](./docs/VOICE-PAGES.md)** (shipped): create a
    landing page in your account whose destination is a live AI voice call
    about your listing — publish, point your ad at it, connect your own
    domain, and captured buyers land in your CRM.
-   **[The White-Label OS funnel](./docs/WHITELABEL-FUNNEL.md)** (shipped):
    /pitch builds a prospect's fully-branded system live during an AI sales
    call.
-   **[Product Catalog](./docs/PRODUCT-CATALOG.md)**: all nine SKUs, the
    pricing ladder, and the shipping order.

---

## Core Architecture

The system is built on a modular, event-driven architecture designed for scalability and extensibility.

-   **Frontend**: A responsive and performant UI built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **ShadCN UI** components.
-   **AI Core**: All AI capabilities are powered by **Genkit**, Google's open-source framework for building production-grade AI flows, using the latest **Gemini** models.
-   **Backend & Data**: The backend is serverless, utilizing **Firebase** for Authentication, **Firestore** for the database (e.g., user profiles, project libraries), and **Cloud Storage** for assets.
-   **Event Bus**: Cloud Pub/Sub and Cloud Functions form the backbone of our event-driven system, allowing services to communicate asynchronously and enabling complex, multi-step workflows.

---

## Key Concepts

-   **Service Cards (Apps)**: The core of the user experience. Each tool (e.g., "Insta Ads Designer," "Market Reports") is a self-contained "Service Card" in the dashboard. Users can add these apps to their workspace to build their personalized toolkit.
-   **AI Flows**: Each Service Card is powered by one or more Genkit AI flows (`src/ai/flows`). These flows encapsulate the business logic and calls to the Gemini API, taking user input and producing intelligent outputs.
-   **Pilots (Automated Workflows)**: Certain tools, like the `Meta Auto Pilot`, act as orchestrators. They don't just perform a single task; they run a sequence of other AI flows to complete a complex workflow, such as launching a full ad campaign from a single user command.
-   **Brand Kit & Knowledge Base**: A central repository per user (`/dashboard/brand`) where they can upload their logos, define brand colors, and provide documents (brochures, client lists). The AI Assistant and other creative tools use this data to ensure all generated content is personalized and on-brand.

---

## Getting Started

### Prerequisites

-   Node.js (v18 or later)
-   npm or yarn
-   Firebase Account & Project

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-repo/entrestate.git
    cd entrestate
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    -   Create a `.env.local` file in the root directory.
    -   Add your Firebase project configuration keys (from the Firebase console) and your Google AI (Gemini) API key.
    ```
    NEXT_PUBLIC_FIREBASE_API_KEY=...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
    NEXT_PUBLIC_FIREBASE_APP_ID=...
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...

    GEMINI_API_KEY=...
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

---

## Contributing

We welcome contributions! The easiest way to contribute is by adding a new **Service Card**. Please see the detailed guide in `CONTRIBUTING.md`.

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
