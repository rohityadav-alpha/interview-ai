// src/aap/api/generate-questions/route.ts
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { skill, difficulty, count = 10 } = await req.json();

    if (!skill || !difficulty) {
      return NextResponse.json(
        { error: "skill and difficulty are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server misconfigured: missing GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are an expert technical interviewer.
Generate exactly ${count} concise, distinct interview questions.
- Skill: ${skill}
- Difficulty: ${difficulty}
Return ONLY a strict JSON array of strings. No numbering, no extra text. Example:
["Question 1...", "Question 2...", "..."]`;

    const resp = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.3, responseMimeType: "application/json" },
    });

    const raw =
      typeof resp.text === "function" ? resp.text() : (resp as any).text;
    if (!raw) {
      return NextResponse.json(
        { error: "Empty response from model" },
        { status: 502 }
      );
    }

    let questions: string[] = [];
    try {
      questions = JSON.parse(raw);
    } catch {
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          questions = JSON.parse(match[0]);
        } catch (e) {
          return NextResponse.json(
            { error: "Model returned malformed JSON" },
            { status: 502 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "Model returned non-JSON output" },
          { status: 502 }
        );
      }
    }

    questions = questions
      .filter((q) => typeof q === "string")
      .map((q) => q.trim())
      .filter(Boolean)
      .slice(0, count);

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "No questions generated" },
        { status: 502 }
      );
    }

    return NextResponse.json({ questions });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Internal error generating questions" },
      { status: 500 }
    );
  }
}
