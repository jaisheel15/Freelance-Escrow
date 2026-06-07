// ─────────────────────────────────────────────
// Milestone Agent — converts evidence to completion scores
// ─────────────────────────────────────────────
import type { MilestoneOutput, MilestoneScore, MilestoneEvidence } from '@/lib/types';
import { askLLM } from './llm';

export function findFuzzyMatch(key: string, obj: Record<string, any>): any | null {
  if (!obj) return null;
  if (obj[key] !== undefined) return obj[key];
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const targetNorm = norm(key);
  for (const k of Object.keys(obj)) {
    if (norm(k) === targetNorm) return obj[k];
  }
  for (const k of Object.keys(obj)) {
    const kn = norm(k);
    if (kn.includes(targetNorm) || targetNorm.includes(kn)) return obj[k];
  }
  return null;
}

export async function runMilestoneAgent(
  milestones: { title: string; weight: number; description: string }[],
  evidence:   Record<string, MilestoneEvidence>,
  fileContents?: Record<string, string>,
): Promise<MilestoneOutput> {

  const systemPrompt = `You are a strict, expert software QA auditor. Your job is to verify whether the developer has actually implemented the technical requirements, or if they have checked in mock files, stubs, or empty boilerplate.
For each milestone, you will receive:
1. The title and client description.
2. The expected "Technical Features" or "Expected Code Signatures".
3. The matching files found by the Evidence Agent.
4. The ACTUAL SOURCE CODE CONTENT of those files (truncated for size).

You MUST inspect the actual code content:
- If the file is empty, holds only comments (e.g. "// TODO: implement"), has simple mock placeholders, or has only boilerplate imports, assign a completion score of 0% to 20% ("Not Started").
- If some functions exist but are incomplete or lack database integration, state management, or UI wiring, assign 21% to 80% ("Partial").
- If the files show a fully functional, complete implementation matching the technical features, assign 81% to 100% ("Completed").

Be extremely honest. Do not give points for code that isn't there.

Return ONLY a JSON object with this exact shape:
{
  "scores": {
    "Milestone Title": {
      "completion": 95,
      "status": "Completed" | "Partial" | "Not Started",
      "reasoning": "Audit analysis explaining exactly what was verified in the file contents and what is missing."
    }
  }
}`;

  const userPrompt = `Milestones, Expected Features, and Code Verification:
${milestones.map(m => {
  const proof = findFuzzyMatch(m.title, evidence) || { files: [], commits: [], status: 'missing' };
  const parts = m.description.split('\n---TECHNICAL_FEATURES---\n');
  const clientDesc = parts[0] || '';
  const expectedTech = parts[1] || 'General structure';
  
  // Assemble the code snippets
  const codeSnippets = proof.files && fileContents
    ? proof.files.slice(0, 2).map((f: string) => {
        const content = fileContents[f];
        const displayContent = content ? content.substring(0, 1200) : '// File was not found or failed to load.';
        return `File: "${f}"\n\`\`\`\n${displayContent}\n\`\`\``;
      }).join('\n\n')
    : 'No file content was retrieved.';

  return `=== Milestone: "${m.title}" ===
Client Requirement: ${clientDesc}
Expected Technical Features: ${expectedTech}
Evidence Files: ${JSON.stringify(proof.files)}
Evidence Commits: ${JSON.stringify(proof.commits)}

Source Code Contents:
${codeSnippets}
`;
}).join('\n\n')}`;

  try {
    const raw = await askLLM(userPrompt, systemPrompt, true);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.scores) {
        const milestoneScores: MilestoneScore[] = milestones.map(m => {
          const match = findFuzzyMatch(m.title, parsed.scores) || { completion: 0, status: 'Not Started', reasoning: 'No LLM score generated.' };
          const completion = Math.min(100, Math.max(0, Number(match.completion) || 0));
          let status: MilestoneScore['status'] = 'Not Started';
          if (completion >= 81) status = 'Completed';
          else if (completion >= 21) status = 'Partial';

          return {
            title: m.title,
            completion,
            status,
            reasoning: match.reasoning || 'Audit evaluation complete.',
          };
        });

        const completed = milestoneScores.filter(s => s.status === 'Completed').length;
        const partial   = milestoneScores.filter(s => s.status === 'Partial').length;
        const missing   = milestoneScores.filter(s => s.status === 'Not Started').length;

        return {
          status: 'success',
          milestoneScores,
          reasoning: `Scored ${milestones.length} milestones: ${completed} Completed, ${partial} Partial, ${missing} Not Started.`,
        };
      }
    }
  } catch { /* fallback */ }

  // ── Heuristic fallback if LLM is unavailable or fails ──
  const milestoneScores: MilestoneScore[] = milestones.map(m => {
    const proof = findFuzzyMatch(m.title, evidence);
    let completion = 0;
    let status: MilestoneScore['status'] = 'Not Started';
    let reasoning = 'No evidence evaluated.';

    if (proof) {
      switch (proof.status) {
        case 'completed':
          completion = 95;
          status = 'Completed';
          reasoning = `${proof.files.length} verified files and ${proof.commits.length} commits confirm full implementation.`;
          break;
        case 'partial':
          completion = 50;
          status = 'Partial';
          reasoning = `${proof.files.length} files found but not all requirements are met. ${proof.commits.length} related commits.`;
          break;
        case 'missing':
          completion = 5;
          status = 'Not Started';
          reasoning = "No repository artifacts matched this milestone's criteria.";
          break;
        default:
          completion = 0;
          status = 'Not Started';
          reasoning = 'Insufficient data to evaluate milestone.';
      }
    }

    return { title: m.title, completion, status, reasoning };
  });

  const completed = milestoneScores.filter(s => s.status === 'Completed').length;
  const partial   = milestoneScores.filter(s => s.status === 'Partial').length;
  const missing   = milestoneScores.filter(s => s.status === 'Not Started').length;

  return {
    status:         'success',
    milestoneScores,
    reasoning:      `Scored ${milestones.length} milestones via fallback heuristic: ${completed} Completed, ${partial} Partial, ${missing} Not Started.`,
  };
}
