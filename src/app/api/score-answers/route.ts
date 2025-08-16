// D:\interview-ai\src\app\api\score-answers\route.ts
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      skill,
      difficulty,
      questions,
      answers,
      isPartialInterview = false,
      questionsAttempted = questions?.length,
      totalQuestions = questions?.length
    } = body || {};

    // ✅ Same validation pattern as generate-questions
    if (!skill || !difficulty || !Array.isArray(questions) || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: "skill, difficulty, questions and answers are required" },
        { status: 400 }
      );
    }

    // ✅ Same API key check as generate-questions  
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server misconfigured: missing GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    // ✅ Simple, clean prompt like generate-questions
    const prompt = `You are an expert technical interviewer. Score these ${questions.length} interview answers for ${skill} at ${difficulty} level.
${isPartialInterview ? `PARTIAL INTERVIEW: ${questionsAttempted}/${totalQuestions} questions.` : ''}

Return ONLY a strict JSON object. No extra text. Example:
{
  "perQuestion": [{"score": 8, "feedback": "Good answer", "confidence": "high"}],
  "summary": {"total": 80, "avg": 8.0, "strengths": ["Clear"], "improvements": ["Practice"], "confidenceTips": ["Study"]}
}

Q&A Pairs:
${questions.map((q, i) => `Q${i+1}: ${q}\nA${i+1}: ${answers[i] || 'No answer'}`).join('\n\n')}`;

    // ✅ Same model call pattern as generate-questions
    const resp = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.3, responseMimeType: "application/json" },
    });

    // ✅ Same response extraction as generate-questions
    const raw = typeof resp.text === "function" ? resp.text() : (resp as any).text;

    if (!raw) {
      return NextResponse.json(
        { error: "Empty response from model" },
        { status: 502 }
      );
    }

    // ✅ Same JSON parsing pattern as generate-questions
    let scoringData: any = {};
    try {
      scoringData = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          scoringData = JSON.parse(match[0]);
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

    // ✅ Same validation pattern as generate-questions
    if (!scoringData.perQuestion || !Array.isArray(scoringData.perQuestion)) {
      return NextResponse.json(
        { error: "No scoring data generated" },
        { status: 502 }
      );
    }

    // ✅ Clean and validate like generate-questions filters questions
    const cleanedResponse = {
      perQuestion: scoringData.perQuestion
        .slice(0, questions.length)
        .map((item: any, index: number) => ({
          score: Math.max(0, Math.min(10, Math.floor(Number(item?.score) || 0))),
          feedback: String(item?.feedback || "").trim() || `Feedback for question ${index + 1}`,
          confidence: ["low", "medium", "high"].includes(String(item?.confidence || "").toLowerCase())
            ? String(item?.confidence).toLowerCase() as "low" | "medium" | "high"
            : "medium" as const
        })),
      summary: {
        total: Math.max(0, Math.min(questions.length * 10, Number(scoringData.summary?.total) || 0)),
        avg: Math.max(0, Math.min(10, Number(scoringData.summary?.avg) || 0)),
        strengths: Array.isArray(scoringData.summary?.strengths) 
          ? scoringData.summary.strengths.slice(0, 5).filter(Boolean)
          : ["Interview completed"],
        improvements: Array.isArray(scoringData.summary?.improvements)
          ? scoringData.summary.improvements.slice(0, 5).filter(Boolean) 
          : ["Continue practicing"],
        confidenceTips: Array.isArray(scoringData.summary?.confidenceTips)
          ? scoringData.summary.confidenceTips.slice(0, 5).filter(Boolean)
          : ["Practice more"]
      }
    };

    return NextResponse.json(cleanedResponse);

  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Internal error scoring answers" },
      { status: 500 }
    );
  }
}
