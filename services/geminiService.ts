
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are an AI documentation assistant integrated into Mark, a professional markdown editor for iPad.

Your capabilities:
1. Analyze markdown documents for clarity, consistency, and completeness.
2. Suggest improvements while preserving the author's voice and intent.
3. Identify outdated information or contradictions.
4. Generate summaries and explanations.
5. Propose specific edits with clear reasoning.

When editing:
- Always explain WHY you suggest a change.
- Preserve technical accuracy.
- Maintain the document's existing structure unless restructuring is explicitly needed.
- Flag assumptions you're making.

Output Format:
- Use standard Markdown.
- For summaries: Concise bullet points followed by key takeaways.
- For edits: Clearly separate suggestions from explanations.
- For analysis: Structured findings with severity (INFO/WARNING/CRITICAL).`;

export const geminiService = {
  async chat(prompt: string, context: string, history: { role: 'user' | 'model', text: string }[]) {
    // Correctly initialize GoogleGenAI with process.env.API_KEY as a named parameter.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const contents = [
      ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
      {
        role: 'user',
        parts: [{ text: `CONTEXT (Current Document Content):\n\`\`\`markdown\n${context}\n\`\`\`\n\nUSER REQUEST: ${prompt}` }]
      }
    ];

    // Use ai.models.generateContent to query GenAI as required by the latest SDK guidelines.
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: contents as any,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    // Directly access the .text property from the GenerateContentResponse.
    return response.text || "No response from AI.";
  },

  async generateCommitMessage(oldContent: string, newContent: string) {
    // Correctly initialize GoogleGenAI with process.env.API_KEY as a named parameter.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Based on the following changes in a markdown file, generate a concise and descriptive GitHub commit message (subject line and optional body). 
    
    OLD CONTENT:
    ${oldContent.substring(0, 1000)}...
    
    NEW CONTENT:
    ${newContent.substring(0, 1000)}...`;

    // Use gemini-3-flash-preview for basic text tasks like commit message generation.
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are a senior developer writing clean, professional Git commit messages.",
        temperature: 0.3,
      },
    });

    // Directly access the .text property from the GenerateContentResponse.
    return response.text || "Update markdown file";
  }
};
