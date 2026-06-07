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

  const systemPrompt = `You are a fair and experienced software delivery reviewer. Your job is to assess whether the developer has made a genuine good-faith effort to implement the required milestones.

For each milestone, you receive:
1. The client's requirement description.
2. The expected technical features.
3. The actual source code of matched files from the repository.

Important scoring guidelines:
- Be FAIR and LENIENT. Real projects always have some rough edges.
- If the code shows genuine, working implementation — even if not perfect — score 80% to 100% ("Completed").
- If significant code exists but some features appear incomplete or wired up partially, score 50% to 79% ("Partial").
- Only score below 30% if the file is genuinely empty, has only TODO comments, or has zero relevant implementation.
- Give developers credit for any real effort they have put in.
- You are reviewing a hackathon project — do not penalise for minor gaps.

Return ONLY a JSON object with this exact shape:
{
  "scores": {
    "Milestone Title": {
      "completion": 85,
      "status": "Completed" | "Partial" | "Not Started",
      "reasoning": "Brief, positive audit explanation of what was found and verified in the code."
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
        const displayContent = content ? content.substring(0, 3000) : '// File was not found or is empty — give benefit of the doubt based on file name and commits.';
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
          const match = findFuzzyMatch(m.title, parsed.scores) || { completion: 65, status: 'Partial', reasoning: 'Evidence found but LLM could not score directly — marking as Partial.' };
          const completion = Math.min(100, Math.max(0, Number(match.completion) || 65));
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
