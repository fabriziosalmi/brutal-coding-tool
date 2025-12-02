import { GoogleGenAI, Type } from "@google/genai";
import { AuditResult, AuditScores } from "../types";

const VIBECODING_PATTERNS = `
CRITICAL VIBECODING & SOTA PATTERNS TO DETECT (The "Vibecoding" Checklist):
- **Security Fails**: Hardcoded API keys, committed .env, chmod 777, SQL injection vectors, password plain text.
- **Dependency Hell**: node_modules committed, unused deps, legacy versions.
- **Lazy Coding**: "WIP" commits, console.log in prod, God Objects, "utils.js" dumping grounds.
- **Logic Flaws**: Swallowing errors (empty catch), Magic Numbers, Race conditions (sleep/wait), Infinite loops.
- **UI/UX Crimes**: Scroll hijacking, missing loading states, broken back buttons, low contrast, layout shifts.
- **SOTA Engineering (The Gold Standard)**: Idempotency keys, Circuit Breakers, Type Safety (Strict TypeScript), Immutable Infrastructure, 100% Test Coverage, Semantic Versioning, Zero Trust Architecture.
`;

const SYSTEM_INSTRUCTION = `
Role: You are a Principal Engineer & Technical Due Diligence Auditor with 20 years of experience in High-Frequency Trading and Critical Infrastructure. You are cynical, detail-oriented, and distrustful of "hype". You hate "Happy Path" programming.
Current Date: November 2025.

Objective: Analyze the provided codebase/project summary and perform a Brutal Reality Audit. You must distinguish between "AI-Generated Slop" (Vibe Coding) and "Engineering Substance" (Production Grade).

${VIBECODING_PATTERNS}

INPUT DATA ANALYSIS PROTOCOL:
1. **Analyze Commit History**: Look for "wip", "fix", "update" spam (Low IQ) vs descriptive, atomic commits (High IQ). Look for solo-dev patterns masquerading as a team.
2. **Analyze Source Samples**: Look at the logic in the provided source files. Is it defensive? Is it typed? Is it efficient? Or is it basic "if/else" spaghetti?
3. **Analyze Manifests**: Are dependencies pinned? Are there unused bloated libs?

OUTPUT REQUIREMENTS:
You MUST return the result in a specific JSON structure.
Be brutal in your scoring.
Most projects should fall in the 40-60 range.
Only give >80 to absolutely pristine, NASA-grade engineering.
`;

// Schema definition for Structured Output
const AUDIT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    scores: {
      type: Type.OBJECT,
      properties: {
        architecture: { type: Type.INTEGER, description: "Score 0-20. Architectural Justification, Dependencies, etc." },
        core: { type: Type.INTEGER, description: "Score 0-20. Error Handling, Concurrency, etc." },
        performance: { type: Type.INTEGER, description: "Score 0-20. Latency, Limits, State, Network." },
        security: { type: Type.INTEGER, description: "Score 0-20. Validation, Supply Chain, Secrets, Observability." },
        qa: { type: Type.INTEGER, description: "Score 0-20. Testing, CI/CD, Deployment, Git Hygiene." },
        total: { type: Type.INTEGER, description: "Sum of all scores (0-100)" },
      },
      required: ["architecture", "core", "performance", "security", "qa", "total"]
    },
    phase1: {
      type: Type.ARRAY,
      description: "The 20-Point Matrix broken into 5 categories.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Category Title (e.g., Architecture & Vibe)" },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING, description: "Metric Name" },
                score: { type: Type.INTEGER, description: "Score 0-5 for this specific metric" },
                description: { type: Type.STRING, description: "Brutal justification for the score" }
              },
              required: ["label", "score", "description"]
            }
          }
        },
        required: ["title", "items"]
      }
    },
    phase2Markdown: { 
      type: Type.STRING, 
      description: "Markdown content for Phase 2: The Vibe Check. Explain the scores and the 'Vibe Ratio'. Be sarcastic but technical." 
    },
    phase3Steps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of exactly 10 prioritized remediation steps (The Pareto Fix Plan)."
    },
    verdictShort: { type: Type.STRING, description: "A one-sentence, ruthless summary verdict." },
    finalVerdictMarkdown: { type: Type.STRING, description: "Detailed final verdict paragraph in Markdown." }
  },
  required: ["scores", "phase1", "phase2Markdown", "phase3Steps", "verdictShort", "finalVerdictMarkdown"]
};

// Helper to perform the actual generation call (Unary with Schema)
async function performGeminiAudit(ai: GoogleGenAI, modelName: string, prompt: string): Promise<any> {
    console.log(`[Gemini] Starting structured audit with model: ${modelName}`);
    
    const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.7,
            responseMimeType: "application/json",
            responseSchema: AUDIT_SCHEMA
        }
    });

    const text = response.text;
    if (!text) throw new Error("Received empty response");
    
    try {
        return JSON.parse(text);
    } catch (e) {
        console.error("Failed to parse JSON response", e);
        throw new Error("Invalid JSON returned from model");
    }
}

export const runAudit = async (repoUrl: string, codeContext: string): Promise<AuditResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
  Analyze this repository: ${repoUrl}
  
  AUTO-FETCHED REPOSITORY CONTEXT:
  ${codeContext}
  
  Instructions:
  1. **Commit History Check**: Look at the provided commit log. Are there many "fix" or "wip" commits? Is it a solo dev?
  2. **File Tree Check**: Is it well structured or a flat mess?
  3. **Code Intelligence Check**: Look at the [ACTUAL SOURCE CODE SAMPLES] section. Read the code. Is it smart? Does it use advanced types/patterns? Or is it beginner level?
  4. **Date Awareness**: Today is November 2025.
  
  Execute the SUPER PROMPT: The Reality Check & Vibe Audit Protocol.
  Fill the JSON schema completely.
  `;

  let jsonResult: any = null;
  let modelUsed = 'gemini-2.5-flash';

  try {
    // Attempt 1: Gemini 3.0 Pro Preview (Smarter, Supports Schema)
    try {
        modelUsed = 'gemini-3-pro-preview';
        jsonResult = await performGeminiAudit(ai, 'gemini-3-pro-preview', prompt);
    } catch (primaryError) {
        console.warn("[Gemini] Primary Model Failed. Attempting Flash.", primaryError);
        
        // Attempt 2: Gemini 2.5 Flash (Faster, Reliable Schema)
        modelUsed = 'gemini-2.5-flash';
        jsonResult = await performGeminiAudit(ai, 'gemini-2.5-flash', prompt);
    }

    if (!jsonResult || !jsonResult.scores) {
        throw new Error("Incomplete data received from audit.");
    }

    return {
      repoName: repoUrl.split('/').pop() || "Repository",
      verdictShort: jsonResult.verdictShort || "Audit Failed",
      finalVerdictContent: jsonResult.finalVerdictMarkdown || "",
      phase1: jsonResult.phase1 || [],
      phase2Content: jsonResult.phase2Markdown || "",
      phase3Plans: jsonResult.phase3Steps || [],
      scores: jsonResult.scores,
      modelUsed
    };

  } catch (error) {
    console.error("Gemini Audit Final Failure", error);
    throw error;
  }
};