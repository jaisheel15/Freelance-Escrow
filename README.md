# krow — AI-Verified Freelance Escrow

**krow** is a decentralized, AI-powered escrow platform designed to eliminate subjectivity and disputes in software freelancing. By combining the high-performance **Monad** blockchain with a **6-Agent AI Orchestra**, krow ensures that developer milestones are objectively verified against GitHub repositories and payments are released automatically upon successful completion.

---

## 🏗️ Architecture & Flow

krow operates on a completely automated trustless verification loop:

1. **Contract Creation:** The client defines project requirements and locks funds (MON) into a Monad smart contract.
2. **Milestone Decomposition:** AI automatically breaks the requirements into measurable milestones.
3. **Development & Submission:** The developer writes code, pushes to GitHub, and submits a PR.
4. **AI Verification (The 6-Agent Orchestra):** Specialized AI agents scan the repository, extract evidence, score completion, and compile an audit report.
5. **Automated Payout:** If the AI verdict is "Approved" (score > 80%), the smart contract is triggered, and funds are instantly released to the developer.

---

## 🤖 The 6-Agent AI Orchestra

The core engine of krow is a sequential, multi-agent pipeline powered by **Groq** (Llama 3.3 70B). Each agent has a single responsibility:

1. **GitHub Agent (Repo Intelligence):** Scans all files, commits, and PR diffs from the linked repository.
2. **Evidence Agent (Proof Extractor):** Semantically maps every code artifact to a specific project milestone using a benefit-of-the-doubt approach.
3. **Milestone Agent (Completion Scorer):** Deeply analyzes actual source code (up to 3,000 characters per file) to assign a completion percentage (0-100%) to each milestone.
4. **Verify Agent (Quality Auditor):** Cross-checks code quality against original contract requirements.
5. **Report Agent (Audit Compiler):** Generates a structured markdown report for both the client and developer.
6. **Payment Agent (Payout Arbitrator):** Computes the weighted escrow release and stages the smart contract execution.

---

## 💻 Tech Stack

*   **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind-style Vanilla CSS (custom CSS variable theming)
*   **Blockchain Integration:** Viem, Wagmi (simulated for dev/hackathon)
*   **AI Inference:** Groq SDK (Llama 3.3 70B-versatile), with fallbacks configured for NVIDIA NIM, Gemini, and OpenRouter.
*   **Database:** Local/Mock DB (simulated for dev/hackathon)
*   **Styling & UI:** Lucide React (Icons), `next-themes` (Dark Mode), custom `FadeSection` animations.

---

## 🚀 Getting Started (Local Development)

### Prerequisites
*   Node.js (v18+)
*   npm or yarn

### Installation

1.  **Clone the repository:**
    \`\`\`bash
    git clone https://github.com/Durgaprasad-Developer/Freelance-Escrow.git
    cd Freelance-Escrow
    \`\`\`

2.  **Install dependencies:**
    \`\`\`bash
    npm install
    \`\`\`

3.  **Environment Variables:**
    Create a \`.env\` file in the root directory and add your Groq API Key:
    \`\`\`env
    GROQ_API_KEY=your_groq_api_key_here
    \`\`\`
    *(Optional: Add \`NVIDIA_API_KEY\`, \`GEMINI_API_KEY\`, or \`OPENROUTER_API_KEY\` for fallbacks).*

4.  **Run the development server:**
    \`\`\`bash
    npm run dev
    \`\`\`

5.  Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📝 Demo Notes for Hackathon

*   **Blockchain Simulation:** For the hackathon demo, the Monad smart contract execution is simulated using a robust `localStorage` wrapper in `src/lib/blockchain.ts`.
*   **Verification Speed:** The agent orchestration is tuned to provide a full repository audit in under 60 seconds.
*   **Demo Repo:** Use the project's own repository URL when demonstrating the verification feature to show a "meta" audit.

---
*Built for the Monad Hackathon 2025*
