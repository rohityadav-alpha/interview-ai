// D:\interview-ai\src\app\api\report\route.ts
import { NextResponse } from 'next/server';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url!);
    const interview_id = searchParams.get('interview_id');
    const user_email = searchParams.get('user_email');
    if (!interview_id || !user_email) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Fetch responses for this interview & email
    const results = await sql`
      SELECT *
      FROM interview_responses
      WHERE interview_id = ${interview_id} AND user_email = ${user_email}
      ORDER BY question_number ASC;
    `;
    if (!results.length) {
      return NextResponse.json({ error: 'No report found!' }, { status: 404 });
    }

    // Join improvements/confidenceTips from all Qs
    const interviewImprovements = [];
    const interviewConfidenceTips = [];
    for (const r of results) {
      if (r.improvements) interviewImprovements.push(r.improvements);
      if (r.confidence_tips) interviewConfidenceTips.push(r.confidence_tips);
    }
    const row = results[0];
    const meta = {
      interview_id: row.interview_id,
      user_first_name: row.user_first_name,
      user_last_name: row.user_last_name,
      skill: row.skills,
      total_score: row.final_score,
      avg_score: row.avg_score,
      improvements: interviewImprovements.join("; "),
      confidence_tips: interviewConfidenceTips.join("; "),
      created_at: row.created_at,
    };
    const questions = results.map(r => ({
      q_no: r.question_number,
      question: r.question_text,
      user_answer: r.user_answer,
      ai_score: r.ai_score,
      ai_feedback: r.ai_feedback,
      confidence: r.confidence,
      response_time: r.response_time,
    }));

    return NextResponse.json({ meta, questions });
  } catch (err: any) {
    return NextResponse.json({ error: 'Server error generating report', details: err.message }, { status: 500 });
  }
}
