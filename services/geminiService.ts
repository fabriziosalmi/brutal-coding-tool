
import { GoogleGenAI, Type } from "@google/genai";
import { AuditResult, AuditScores } from "../types";

const SYSTEM_INSTRUCTION = `
Role: You are a Principal Engineer & Technical Due Diligence Auditor with 20 years of experience in High-Frequency Trading and Critical Infrastructure. You are cynical, detail-oriented, and distrustful of "hype". You hate "Happy Path" programming.
Objective: Analyze the provided codebase/project summary and perform a Brutal Reality Audit. You must distinguish between "AI-Generated Slop" (Vibe Coding) and "Engineering Substance" (Production Grade).

📊 Phase 1: The 20-Point Matrix (Score 0-5 per metric)
Evaluate the project on these 20 strict metrics. 0 = Total Fail / Vaporware | 5 = State of the Art / Google-Level
(Categories: Architecture & Vibe, Core Engineering, Performance & Scale, Security & Robustness, QA & Operations)
*Use the provided File Tree, Commit History, and README to deduce the project state.*

📉 Phase 2: The Scores
Calculate Total Score (0-100).
Define the "Vibe Ratio".

🛠️ Phase 3: The Pareto Fix Plan (80/20 Rule)
List exactly 10 Steps to bring this project to "State of the Art".

Final Verdict: Summarize the project in one ruthless sentence.

IMPORTANT OUTPUT FORMATTING:
1. Provide the report in strict Markdown format.
2. Use emojis as specified in the prompt.
3. AT THE VERY END OF YOUR RESPONSE, you MUST append a JSON block wrapped in \`\`\`json \`\`\` that contains the raw scores for visualization. The format must be:
{
  "architecture": number, // Sum of Architecture metrics (0-20)
  "core": number, // Sum of Core Engineering metrics (0-20)
  "performance": number, // Sum of Performance metrics (0-20)
  "security": number, // Sum of Security metrics (0-20)
  "qa": number, // Sum of QA metrics (0-20)
  "total": number, // Total Score (0-100)
  "verdict_short": "string" // The one sentence verdict
}
`;

export const runAudit = async (repoUrl: string, codeContext: string): Promise<AuditResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
  Analyze this repository: ${repoUrl}
  
  AUTO-FETCHED REPOSITORY CONTEXT:
  ${codeContext}
  
  Instructions:
  1. Check the Commit History: Are there many "fix" or "wip" commits? Is it a solo dev or a team? Is the velocity real?
  2. Check the File Tree: Is it well structured or a flat mess? Are there tests?
  3. Check the README vs Reality: Do they promise features that aren't in the file tree?
  4. Check Dependencies (if manifest is provided): Is it bloated?
  
  Execute the SUPER PROMPT: The Reality Check & Vibe Audit Protocol.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7, // High creativity for the "roast" aspect
      }
    });

    const text = response.text || "";

    // Extract JSON block from the end
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    let scores: AuditScores | null = null;
    let verdict = "Analysis Failed";
    let cleanMarkdown = text;

    if (jsonMatch) {
      try {
        const jsonRaw = jsonMatch[1];
        const parsed = JSON.parse(jsonRaw);
        scores = {
          architecture: parsed.architecture || 0,
          core: parsed.core || 0,
          performance: parsed.performance || 0,
          security: parsed.security || 0,
          qa: parsed.qa || 0,
          total: parsed.total || 0,
        };
        verdict = parsed.verdict_short || "Audit Complete";
        
        // Remove the JSON block from the display markdown
        cleanMarkdown = text.replace(jsonMatch[0], '').trim();
      } catch (e) {
        console.error("Failed to parse score JSON", e);
      }
    }

    return {
      markdownReport: cleanMarkdown,
      scores,
      repoName: repoUrl.split('/').pop() || "Repository",
      verdict
    };

  } catch (error) {
    console.error("Gemini Audit Failed", error);
    throw error;
  }
};
