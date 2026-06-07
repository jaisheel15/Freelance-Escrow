// ─────────────────────────────────────────────
// Planner Agent — converts requirements to milestones
// ─────────────────────────────────────────────
import type { PlannerOutput, PlannedMilestone } from '@/lib/types';
import { askLLM } from './llm';

export async function runPlannerAgent(description: string): Promise<PlannerOutput> {
  const systemPrompt = `You are a technical project planner. Decompose the user's project requirements into 3 to 5 logical milestones.
For each milestone, generate:
1. "title": High-level client-friendly title.
2. "description": Brief client-friendly description.
3. "technical_features": A list of 3-5 specific technical features, files, libraries, or code structures required to implement this milestone.
4. "weight": Integer weight (the sum of all milestone weights MUST equal exactly 100).

Return ONLY a JSON object with this exact shape:
{
  "milestones": [
    {
      "title": "User Authentication",
      "description": "Allows users to register and login securely.",
      "technical_features": [
        "hashing passwords with bcrypt",
        "JWT session token cookies",
        "LoginForm and RegisterForm UI elements",
        "auth middleware for route protection"
      ],
      "weight": 20
    }
  ],
  "reasoning": "Explain the decomposition briefly"
}`;

  const userPrompt = `Decompose this project description:\n"${description}"`;

  try {
    const raw = await askLLM(userPrompt, systemPrompt, true);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.milestones) && parsed.milestones.length > 0) {
        // Normalize weights to sum to 100
        const milestones: PlannedMilestone[] = parsed.milestones.map((m: any) => {
          const techFeaturesList = Array.isArray(m.technical_features) ? m.technical_features : [];
          const serializedDesc = String(m.description) + '\n---TECHNICAL_FEATURES---\n' + techFeaturesList.join(', ');
          return {
            title: String(m.title),
            description: serializedDesc,
            weight: Math.round(Number(m.weight)) || 10,
          };
        });
        const total = milestones.reduce((s, m) => s + m.weight, 0);
        let running = 0;
        milestones.forEach((m, idx) => {
          if (idx === milestones.length - 1) {
            m.weight = 100 - running;
          } else {
            m.weight = Math.round((m.weight * 100) / total);
            running += m.weight;
          }
        });
        return {
          status: 'success',
          milestones,
          reasoning: parsed.reasoning || 'Successfully decomposed specifications via AI Planner.',
        };
      }
    }
  } catch { /* fallback */ }

  // ── Heuristic fallback if LLM is unavailable or fails ──
  const d = description.toLowerCase();
  const milestones: PlannedMilestone[] = [];

  if (d.includes('auth') || d.includes('login') || d.includes('signup') || d.includes('user')) {
    milestones.push({
      title: 'User Authentication',
      description: 'Signup and login securely.\n---TECHNICAL_FEATURES---\nbcrypt password hashing, JWT cookies,LoginForm UI component,auth middleware',
      weight: 20
    });
  }
  if (d.includes('dashboard') || d.includes('panel') || d.includes('home')) {
    milestones.push({
      title: 'Dashboard Interface',
      description: 'Responsive layout and analytics panels.\n---TECHNICAL_FEATURES---\nSidebar navigation,StatCard widgets,Layout responsiveness',
      weight: 20
    });
  }
  if (d.includes('task') || d.includes('crud') || d.includes('create') || d.includes('delete') || d.includes('edit')) {
    milestones.push({
      title: 'Core CRUD Operations',
      description: 'Create, read, update, delete database records.\n---TECHNICAL_FEATURES---\nAPI endpoints,Zod schema validation,TaskCard UI component',
      weight: 30
    });
  } else if (d.includes('wallet') || d.includes('web3') || d.includes('contract') || d.includes('token')) {
    milestones.push({
      title: 'Web3 Wallet Integration',
      description: 'Connect browser wallet and call smart contracts.\n---TECHNICAL_FEATURES---\nviem/wagmi connector,ConnectWallet button,contract state read/write',
      weight: 30
    });
  } else if (d.includes('api') || d.includes('endpoint') || d.includes('backend') || d.includes('service')) {
    milestones.push({
      title: 'API Service Layer',
      description: 'Backend services and database interaction.\n---TECHNICAL_FEATURES---\nDatabase schemas,REST endpoints,Axios fetch calls',
      weight: 30
    });
  }
  if (d.includes('search') || d.includes('filter') || d.includes('query')) {
    milestones.push({
      title: 'Search & Filter',
      description: 'Full-text query search and tagging filters.\n---TECHNICAL_FEATURES---\nSearchInput debounce,search filtering API,query pagination',
      weight: 15
    });
  }
  if (d.includes('responsive') || d.includes('mobile') || d.includes('design') || d.includes('ui') || d.includes('ux')) {
    milestones.push({
      title: 'Responsive Design & Polish',
      description: 'Mobile layout optimization and theme control.\n---TECHNICAL_FEATURES---\nTailwind CSS media queries,dark mode toggle,framer-motion animations',
      weight: 15
    });
  }

  // Fallback
  if (milestones.length === 0) {
    milestones.push(
      { title: 'Project Setup & Architecture', description: 'Repository scaffolding.\n---TECHNICAL_FEATURES---\npackage.json,tsconfig.json,Scaffolding layouts', weight: 25 },
      { title: 'Core Feature Implementation', description: 'Primary business logic.\n---TECHNICAL_FEATURES---\nCore components,Main API routes,Database schemas', weight: 50 },
      { title: 'Testing & Quality Assurance', description: 'Error handling.\n---TECHNICAL_FEATURES---\nUnit tests,Error page overlays,Try-catch API wrappers', weight: 25 },
    );
  }

  // Normalize weights to 100
  const total = milestones.reduce((s, m) => s + m.weight, 0);
  let running = 0;
  milestones.forEach((m, i) => {
    if (i === milestones.length - 1) { m.weight = 100 - running; }
    else { m.weight = Math.round(m.weight * 100 / total); running += m.weight; }
  });

  return {
    status: 'success',
    milestones,
    reasoning: `Extracted ${milestones.length} milestones from requirements spec via heuristic planner fallback. Weights normalized to Σ=100.`,
  };
}
