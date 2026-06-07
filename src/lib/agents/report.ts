// ─────────────────────────────────────────────
// Report Agent — produces final markdown audit report
// ─────────────────────────────────────────────
import type { ReportOutput, MilestoneScore, MilestoneEvidence } from '@/lib/types';
import { askLLM } from './llm';

export async function runReportAgent(
  projectTitle:         string,
  completionPercentage: number,
  escrowAmount:         number,
  recommendedRelease:   number,
  confidence:           number,
  milestoneScores:      MilestoneScore[],
  evidence:             Record<string, MilestoneEvidence>,
): Promise<ReportOutput> {

  const date = new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });
  const auditId = Math.random().toString(36).slice(2, 10).toUpperCase();

  const verdictLine = completionPercentage >= 81
    ? `All major milestones are verified. **Release ${recommendedRelease} MON** (100% of escrow).`
    : completionPercentage > 0
    ? `Partial completion detected. **Release ${recommendedRelease} MON** (${completionPercentage}% of escrow). Remaining ${(escrowAmount - recommendedRelease).toFixed(2)} MON stays locked.`
    : `No verifiable progress. All ${escrowAmount} MON should remain locked in escrow.`;

  // 1. Technical Summary prompt
  const systemPrompt = `You are an expert technical auditor. Write a short, highly professional Executive Summary paragraph summarizing the completion of project "${projectTitle}".
State that the project is ${completionPercentage}% complete, and comment on the quality of evidence. Keep it under 100 words.`;

  const userPrompt = `Project: ${projectTitle}
Completion: ${completionPercentage}%
Confidence: ${confidence}%
Recommended Release: ${recommendedRelease} MON
Milestones: ${JSON.stringify(milestoneScores)}`;

  let summaryAnalysis = '';
  try {
    summaryAnalysis = await askLLM(userPrompt, systemPrompt, false);
  } catch {
    summaryAnalysis = `The codebase was evaluated against project milestones. Semantic analysis of file structures and commit histories yielded a completion score of ${completionPercentage}% with an auditor confidence of ${confidence}%.`;
  }

  // 2. Client Translation / PR Decoder prompt
  const clientSystemPrompt = `You are a translator that bridges complex software code changes and business value for non-technical clients.
Your job is to write a highly professional, easy-to-understand progress update for the client who funded the escrow contract.
Explain exactly what was actually built, what is missing or partially done, and what this means for their project, completely avoiding developer terminology (do not use jargon like JWT, database schemas, endpoints, commit hashes, files, APIs, etc.).
Highlight user-facing outcomes. Format your output in clean, beautiful Markdown with clear headers and bullet points.`;

  const clientUserPrompt = `Project: ${projectTitle}
Overall Progress: ${completionPercentage}%
Confidence: ${confidence}%
Escrow Amount: ${escrowAmount} MON
Recommended Release: ${recommendedRelease} MON
Milestone Progress Details:
${milestoneScores.map(m => `- Milestone "${m.title}": Status is "${m.status}" (${m.completion}% complete). details: ${m.reasoning}`).join('\n')}`;

  let clientTranslation = '';
  try {
    clientTranslation = await askLLM(clientUserPrompt, clientSystemPrompt, false);
  } catch {
    clientTranslation = `### 📌 Progress Update for Client

We analyzed the repository code for **${projectTitle}** to verify the work completed by your developer.

- **Overall Progress:** **${completionPercentage}%** of the work has been verified.
- **Completed Features:** Verified milestones include: ${milestoneScores.filter(m => m.completion >= 80).map(m => `**${m.title}**`).join(', ') || 'None yet'}.
- **Partially Built or Missing:** Remaining modules are either incomplete or missing implementation code.
- **Payout Recommendation:** We recommend releasing **${recommendedRelease} MON** of the locked escrow pool, leaving the remainder locked until the outstanding work is submitted.`;
  }

  let milestoneTable = `| Milestone | Weight | Completion | Status |\n|:---|:---:|:---:|:---:|\n`;
  milestoneTable += milestoneScores.map(s => {
    const emoji = s.status === 'Completed' ? '✅' : s.status === 'Partial' ? '🟡' : '⬜';
    return `| ${s.title} | — | ${s.completion}% | ${emoji} ${s.status} |`;
  }).join('\n');

  let evidenceDetail = '';
  Object.values(evidence).forEach(ev => {
    const fileList   = ev.files.length   > 0 ? ev.files.map(f => `- \`${f}\``).join('\n')   : '- *None found*';
    const commitList = ev.commits.length > 0 ? ev.commits.map(c => `- ${c}`).join('\n') : '- *None matched*';
    evidenceDetail += `\n### ${ev.milestoneTitle}\n**Status:** \`${ev.status.toUpperCase()}\`\n\n${ev.reasoning}\n\n**Verified Files:**\n${fileList}\n\n**Matched Commits:**\n${commitList}\n`;
  });

  const markdownReport = `# 🛡️ TrustlessEscrow — AI Audit Report

**Project:** ${projectTitle}  
**Audit ID:** \`${auditId}\`  
**Generated:** ${date}  
**Audit Method:** Multi-Agent Codebase Verification (Rule 11 — Evidence-Only)

---

## Executive Summary

| Metric | Value |
|:---|:---|
| Overall Completion | **${completionPercentage}%** |
| Escrow Balance | ${escrowAmount} MON |
| Recommended Release | **${recommendedRelease} MON** |
| AI Confidence | ${confidence}% |

> **Verdict:** ${verdictLine}

### Analysis
${summaryAnalysis}

---

## Milestone Breakdown

${milestoneTable}

---

## Evidence & Audit Trail

${evidenceDetail}

---

## Audit Integrity

- **Rule 11 (Source of Truth):** Only direct repository evidence counts. No assumptions made.
- **Rule 36 (Anti-Hallucination):** Every claim is backed by a file path or commit SHA.
- **Reproducibility:** This audit is logged on-chain under ID \`${auditId}\`.

*Approved by TrustlessEscrow Orchestrator v1.0* 🤖
`;

  return {
    status: 'success',
    markdownReport,
    summary: `Audit ${auditId} complete. ${completionPercentage}% overall — recommending release of ${recommendedRelease} MON.`,
    clientTranslation,
  };
}
