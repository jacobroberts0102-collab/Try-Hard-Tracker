
import { GoogleGenAI, Type } from "@google/genai";
import { JournalEntry, HabitCompletion, JournalTemplate, Habit } from './types';

// Updated initialization to strictly follow guidelines: new GoogleGenAI({apiKey: process.env.API_KEY})
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_PROMPT = `
You are the CRIPES Habits & Journal assistant. 
Output must be plain text, no Markdown.
Short lines, 3 bullet style lines using hyphen prefix only.
Always include a single "Next step" line at the end.
Tone: Supportive, curious, practical.
Avoid medical or diagnostic language.
`;

export const geminiService = {
  async generateDailyFeedback(entry: JournalEntry, completions: HabitCompletion[], habits: Habit[]) {
    const habitSummary = completions.map(c => {
      const h = habits.find(hab => hab.id === c.habitId);
      return `${h?.name || 'Habit'} (${c.completedType})`;
    }).join(', ');

    const journalContent = JSON.stringify(entry.data);

    const prompt = `
    Based on today's entry: ${journalContent}
    And these habits completed: ${habitSummary}
    Give me supportive daily feedback following the system rules.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { systemInstruction: SYSTEM_PROMPT }
      });
      return response.text;
    } catch (e) {
      console.error(e);
      return "Unable to generate feedback at this time.\n- Keep up the good work\n- Focus on consistency\n- Take it one day at a time\nNext step: Try again tomorrow.";
    }
  },

  async analyzeWeeklyTrends(habits: Habit[], completions: HabitCompletion[], entries: JournalEntry[]) {
    const prompt = `
    Weekly Review Data:
    Habits defined: ${habits.length}
    Completions this week: ${completions.length}
    Journal entries: ${entries.length}
    Common entry tags: ${entries.flatMap(e => e.tags).join(', ')}
    
    Analyze the trends and provide feedback.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { systemInstruction: SYSTEM_PROMPT }
      });
      return response.text;
    } catch (e) {
      return "Review analysis unavailable.\n- Review your data manually\n- Look for patterns in missed habits\n- Celebrate small wins\nNext step: Set one focus for next week.";
    }
  },

  async suggestTemplateFields(template: JournalTemplate, entries: JournalEntry[]) {
    if (entries.length < 7) {
      return "Not enough data yet, create at least 7 entries for this template.";
    }

    const prompt = `
    Analyze the last ${entries.length} entries for template "${template.name}".
    Suggest new fields to improve self-reflection based on the existing content: ${JSON.stringify(entries.map(e => e.data))}
    
    Part 1: 5-8 lines explaining why these fields help.
    ===JSON===
    Part 2: JSON only, array of JournalField objects (id is placeholder).
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { systemInstruction: "You are a specialized template builder. Follow the specific output format." }
      });
      return response.text;
    } catch (e) {
      return "Suggestion service unavailable.";
    }
  }
};
