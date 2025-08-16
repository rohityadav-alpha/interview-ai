// D:\interview-ai\src\app\api\user-interviews\route.ts
import { NextResponse } from 'next/server';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url!);
    const user_email = searchParams.get('user_email');

    if (!user_email) {
      return NextResponse.json({ error: 'Missing user_email' }, { status: 400 });
    }

    // Get all interview_ids for this user's email (latest first)
    const interviewsRes = await sql`
      SELECT DISTINCT interview_id
      FROM interview_responses
      WHERE user_email = ${user_email}
      ORDER BY interview_id DESC;
    `;
    const interview_ids = interviewsRes.map((row: any) => row.interview_id);

    if (!interview_ids.length) {
      return NextResponse.json({ error: 'No interviews found' }, { status: 404 });
    }

    // For each interview, fetch summary info and names
    const interviews: any[] = [];
    for (const interview_id of interview_ids) {
      const rows = await sql`
        SELECT *
        FROM interview_responses
        WHERE interview_id = ${interview_id}
          AND user_email = ${user_email}
        ORDER BY question_number ASC;
      `;
      if (!rows.length) continue;
      const firstRow = rows[0];

      interviews.push({
        interview_id,
        created_at: firstRow.created_at,
        skill: firstRow.skills,
        final_score: firstRow.final_score,
        avg_score: firstRow.avg_score,
        improvements: firstRow.improvements,
        confidence_tips: firstRow.confidence_tips,
        user_first_name: firstRow.user_first_name,
        user_last_name: firstRow.user_last_name,
        // NOTE: email not included in output!
      });
    }

    return NextResponse.json({ user_email, interviews });

  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
