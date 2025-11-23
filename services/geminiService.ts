
import { GoogleGenAI, Type } from "@google/genai";
import { AuditResult, AuditScores } from "../types";

const SYSTEM_INSTRUCTION = `
Role: You are a Principal Engineer & Technical Due Diligence Auditor with 20 years of experience in High-Frequency Trading and Critical Infrastructure. You are cynical, detail-oriented, and distrustful of "hype". You hate "Happy Path" programming.
Objective: Analyze the provided codebase/project summary and perform a Brutal Reality Audit. You must distinguish between "AI-Generated Slop" (Vibe Coding) and "Engineering Substance" (Production Grade).

STRUCTURE YOUR RESPONSE EXACTLY LIKE THIS:

## 📊 PHASE 1: THE 20-POINT MATRIX
Evaluate the project on these 5 categories. Each category has 4 specific metrics. 
For EVERY metric, you must start the line with the score in this format: "1. **[x/5] Metric Name**: Description".
(x is a number 0-5. 0 is failing, 5 is state-of-the-art).

### 🏗️ Architecture & Vibe
1. **[x/5] Architectural Justification**: Does the complexity match the problem? Or is it over-engineered?
2. **[x/5] Dependency Bloat**: Are there too many packages? Are they outdated/abandoned?
3. **[x/5] The "README vs. Code" Gap**: Does the code actually do what the docs say?
4. **[x/5] AI Hallucination Smell**: Does it look like generic ChatGPT code (comments explaining obvious things, weird variable names)?

### ⚙️ Core Engineering
1. **[x/5] Error Handling Strategy**: Is it just "try-catch-log"? Are there custom errors?
2. **[x/5] Concurrency Model**: Is it safe? Race conditions?
3. **[x/5] Data Structures & Algorithms**: Efficient usage or naive implementations?
4. **[x/5] Memory Management**: Leaks? Unnecessary copies? (Or equivalent for GC languages)

### 🚀 Performance & Scale
1. **[x/5] Critical Path Latency**: Bottlenecks in the main loop?
2. **[x/5] Backpressure & Limits**: What happens under load?
3. **[x/5] State Management**: Global mutable state hell?
4. **[x/5] Network Efficiency**: N+1 queries? Bloated payloads?

### 🛡️ Security & Robustness
1. **[x/5] Input Validation**: Zod/Joi? Or trust me bro?
2. **[x/5] Supply Chain**: Sketchy dependencies? Hardcoded versions?
3. **[x/5] Secrets Management**: .env vs hardcoded strings?
4. **[x/5] Observability**: Logs, metrics, tracing?

### 🧪 QA & Operations
1. **[x/5] Test Reality**: Are there tests? Do they test happy path only?
2. **[x/5] CI/CD Maturity**: GitHub Actions? Linting? Formatting?
3. **[x/5] Docker/Deployment**: Reproducible builds?
4. **[x/5] Maintainability**: formatting, folder structure, readable names.

## 📉 PHASE 2: THE SCORES
(Briefly explain the score calculation and the "Vibe Ratio". Be brutal about why they lost points.)

## 🛠️ PHASE 3: THE PARETO FIX PLAN
List exactly 10 Steps to bring this project to "State of the Art". Use a numbered list.
1. [Critical - Security]: ...
2. [Critical - Stability]: ...
(etc...)

## 🔥 FINAL VERDICT
Summarize the project in one ruthless sentence.

IMPORTANT:
1. Use the EXACT headers with "## " and "### " prefixes as shown above. This is used for UI parsing.
2. AT THE VERY END OF YOUR RESPONSE, you MUST append a JSON block wrapped in \`\`\`json \`\`\` that contains the raw scores. The format must be:
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
  Be hyper-critical. Assume guilt until proven innocent.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7, 
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
