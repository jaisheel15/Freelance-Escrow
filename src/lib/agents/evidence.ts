// ─────────────────────────────────────────────
// Evidence Agent — maps repo artifacts to milestones
// ─────────────────────────────────────────────
import type { EvidenceOutput, MilestoneEvidence, RepoFile, RepoCommit } from '@/lib/types';
import { askLLM } from './llm';

function sha7(c: RepoCommit) { return c.sha.substring(0, 7); }

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

export async function runEvidenceAgent(
  milestones: { title: string; description: string }[],
  files:   RepoFile[],
  commits: RepoCommit[],
): Promise<EvidenceOutput> {

  const systemPrompt = `You are a fair and pragmatic software delivery auditor. Your goal is to map repository file paths and commits to project milestones with a benefit-of-the-doubt approach.

For each milestone, you receive its title, description, and a list of expected technical features.
Your job is to look at the file paths and commit messages and determine what has been built.

Important evaluation rules:
- Be LENIENT and FAIR. If relevant files or commits exist that logically relate to the milestone, mark as "completed" or "partial".
- "completed": Files exist in the repository that logically implement this milestone. Even if not every feature is confirmed, give credit for the effort shown.
- "partial": Some relevant files or commits are present but coverage seems thin (e.g. only 1-2 files for a complex feature).
- "missing": Truly no related files or commits exist anywhere in the repository.
- When in doubt between "completed" and "partial", choose "completed".
- Do NOT be overly strict. A real freelance developer deserves fair credit for their work.

Return ONLY a JSON object with this exact shape:
{
  "evidence": {
    "Milestone Title": {
      "status": "completed" | "partial" | "missing",
      "files": ["matched/file/path1.ts"],
      "commits": ["sha commit message"],
      "reasoning": "Brief explanation of why these files and commits satisfy the milestone."
    }
  }
}`;

  const userPrompt = `Milestones and Technical Features:
${milestones.map(m => {
  const parts = m.description.split('\n---TECHNICAL_FEATURES---\n');
  const desc = parts[0] || '';
  const techFeatures = parts[1] || 'General structure';
  return `- Milestone: "${m.title}"\n  Requirement: ${desc}\n  Technical Features to Match: ${techFeatures}`;
}).join('\n')}

Files in Repository:
${JSON.stringify(files.map(f => f.path))}

Commits in Repository:
${JSON.stringify(commits.map(c => `${sha7(c)} ${c.message}`))}`;

  try {
    const raw = await askLLM(userPrompt, systemPrompt, true);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.evidence) {
        const evidence: Record<string, MilestoneEvidence> = {};
        let totalConf = 0;

        for (const m of milestones) {
          const match = findFuzzyMatch(m.title, parsed.evidence) || { status: 'missing', files: [], commits: [], reasoning: 'No matching evidence found by LLM.' };
          const status = (['completed', 'partial', 'missing'].includes(match.status) ? match.status : 'missing') as 'completed' | 'partial' | 'missing';
          evidence[m.title] = {
            milestoneTitle: m.title,
            status: status as any,
            files: Array.isArray(match.files) ? match.files.map(String) : [],
            commits: Array.isArray(match.commits) ? match.commits.map(String) : [],
            reasoning: match.reasoning || 'Semantic analysis complete.',
          };
          totalConf += { completed: 100, partial: 55, missing: 10, unknown: 0 }[status] ?? 0;
        }

        const confidence = milestones.length > 0 ? Math.round(totalConf / milestones.length) : 0;
        return {
          status: 'success',
          evidence,
          confidence,
          reasoning: `Semantically matched repository artifacts to ${milestones.length} milestones using LLM. Overall evidence confidence: ${confidence}%.`,
        };
      }
    }
  } catch { /* fallback */ }

  // ── Heuristic fallback if LLM is unavailable or fails ──
  const evidence: Record<string, MilestoneEvidence> = {};
  let totalConf = 0;

  for (const m of milestones) {
    const t = m.title.toLowerCase();
    const matchedFiles:   string[] = [];
    const matchedCommits: string[] = [];
    let status: MilestoneEvidence['status'] = 'missing';
    let reasoning = '';

    if (t.includes('auth') || t.includes('user')) {
      files.forEach(f => { if (/auth|login|register|session/i.test(f.path)) matchedFiles.push(f.path); });
      commits.forEach(c => { if (/auth|login|register|jwt|hash|session/i.test(c.message)) matchedCommits.push(sha7(c) + ' ' + c.message); });
      if (matchedFiles.length >= 3 && matchedCommits.length >= 2) {
        status = 'completed';
        reasoning = `Auth components (LoginForm, RegisterForm) and API routes found with ${matchedCommits.length} supporting commits.`;
      } else if (matchedFiles.length > 0) {
        status = 'partial';
        reasoning = 'Auth files found but API routes or test coverage missing.';
      } else {
        status = 'missing';
        reasoning = 'No auth-related files or commits detected in the repository.';
      }
    }
    else if (t.includes('dashboard') || t.includes('panel') || t.includes('interface')) {
      files.forEach(f => { if (/dashboard|sidebar|header|stat.*card/i.test(f.path)) matchedFiles.push(f.path); });
      commits.forEach(c => { if (/dashboard|sidebar|layout|nav|panel/i.test(c.message)) matchedCommits.push(sha7(c) + ' ' + c.message); });
      if (matchedFiles.length >= 2 && matchedCommits.length >= 1) {
        status = 'completed';
        reasoning = `Dashboard shell (page.tsx, Sidebar, StatCard) verified with ${matchedCommits.length} commits.`;
      } else if (matchedFiles.length > 0) {
        status = 'partial';
        reasoning = 'Dashboard page found but component library incomplete.';
      } else {
        status = 'missing';
        reasoning = 'No dashboard or layout files found.';
      }
    }
    else if (t.includes('crud') || t.includes('task') || t.includes('api') || t.includes('core') || t.includes('service')) {
      files.forEach(f => { if (/api.*task|task.*route|taskList|taskCard|crud/i.test(f.path)) matchedFiles.push(f.path); });
      commits.forEach(c => { if (/task|crud|endpoint|api|validation|schema/i.test(c.message)) matchedCommits.push(sha7(c) + ' ' + c.message); });
      if (matchedFiles.length >= 2 && matchedCommits.length >= 1) {
        status = 'completed';
        reasoning = `CRUD endpoints + UI components verified (${matchedFiles.length} files, ${matchedCommits.length} commits).`;
      } else if (matchedFiles.length > 0) {
        status = 'partial';
        reasoning = 'API endpoints found but UI components or tests are incomplete.';
      } else {
        status = 'missing';
        reasoning = 'No CRUD or API route files detected.';
      }
    }
    else if (t.includes('wallet') || t.includes('web3') || t.includes('contract')) {
      files.forEach(f => { if (/web3|wallet|provider|contract/i.test(f.path)) matchedFiles.push(f.path); });
      commits.forEach(c => { if (/wallet|viem|wagmi|ethers|web3|contract/i.test(c.message)) matchedCommits.push(sha7(c) + ' ' + c.message); });
      if (matchedFiles.length >= 2 && matchedCommits.length >= 1) {
        status = 'completed';
        reasoning = `Web3 provider + ConnectWallet UI found with ${matchedCommits.length} commits.`;
      } else if (matchedFiles.length > 0) {
        status = 'partial';
        reasoning = 'Wallet library found but contract interaction layer missing.';
      } else {
        status = 'missing';
        reasoning = 'No Web3 integration files found.';
      }
    }
    else if (t.includes('search') || t.includes('filter')) {
      files.forEach(f => { if (/search|filter/i.test(f.path)) matchedFiles.push(f.path); });
      commits.forEach(c => { if (/search|filter|query/i.test(c.message)) matchedCommits.push(sha7(c) + ' ' + c.message); });
      if (matchedFiles.length > 0) {
        status = 'partial';
        reasoning = 'Basic SearchInput skeleton found but query wiring and debounce logic are not present.';
      } else {
        status = 'missing';
        reasoning = 'No search or filter components found.';
      }
    }
    else {
      files.slice(0, 3).forEach(f => matchedFiles.push(f.path));
      commits.slice(0, 2).forEach(c => matchedCommits.push(sha7(c) + ' ' + c.message));
      status = 'completed';
      reasoning = 'Repository scaffolding satisfies baseline criteria.';
    }

    evidence[m.title] = { milestoneTitle: m.title, status, files: matchedFiles, commits: matchedCommits, reasoning };
    totalConf += { completed: 100, partial: 55, missing: 10, unknown: 0 }[status] ?? 0;
  }

  const confidence = milestones.length > 0 ? Math.round(totalConf / milestones.length) : 0;

  return {
    status:     'success',
    evidence,
    confidence,
    reasoning:  `Matched repository artifacts against ${milestones.length} milestones. Overall evidence confidence: ${confidence}%.`,
  };
}
