import { NextResponse } from 'next/server';
import postgres from 'postgres';

// Use existing database connection
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL!;
const client = postgres(connectionString);

export async function POST(request: Request) {
  try {
    const {
      user_id,
      skill,
      difficulty,
      total_score,
      avg_score,
      questions_attempted,
      is_completed,
      interview_duration,
      quit_reason,
      questions_with_answers,
      user_email,
      user_first_name,
      user_last_name,
      user_username,
      is_multi_skill,
      primary_skill,
      all_skills,
      improvements,
      confidence_tips
    } = await request.json();

    // ✅ Enhanced validation with proper null handling
    if (!user_id) {
      return NextResponse.json({
        error: 'user_id is required'
      }, { status: 400 });
    }

    let interviewId: number | null = null;
    let responsesSaved = 0;

    // ✅ FIXED: Enhanced transaction with proper null handling
    await client.begin(async (sql) => {
      try {
        // ✅ FIXED: Insert with proper null handling
        const leaderboardResult = await sql`
          INSERT INTO leaderboard (
            user_id, user_email, user_first_name, user_last_name, user_username,
            skill, difficulty, total_score, avg_score, questions_attempted,
            is_completed, quit_reason, interview_duration, created_at, updated_at
          )
          VALUES (
            ${user_id}, 
            ${user_email || null}, 
            ${user_first_name || null}, 
            ${user_last_name || null}, 
            ${user_username || null}, 
            ${skill || null}, 
            ${difficulty ? difficulty.toLowerCase() : null}, 
            ${total_score || 0}, 
            ${avg_score || 0.0}, 
            ${questions_attempted || 0}, 
            ${is_completed || false}, 
            ${quit_reason || null}, 
            ${interview_duration || 0}, 
            NOW(), 
            NOW()
          )
          RETURNING id
        `;

        interviewId = leaderboardResult[0]?.id ?? null;

        // ✅ Save Q&A responses only if they exist
        if (interviewId && Array.isArray(questions_with_answers) && questions_with_answers.length > 0) {
          for (const qa of questions_with_answers) {
            await sql`
              INSERT INTO interview_responses (
              interview_id, user_id, question_number, question_text,
              user_answer, ai_score, ai_feedback, confidence, response_time,
              improvements, confidence_tips,
              final_score, avg_score, skills,
              user_first_name, user_last_name, user_email,
              created_at
            ) VALUES (
              ${interviewId}, ${user_id},
              ${qa.question_number || 1},
              ${qa.question_text || null},
              ${qa.user_answer || null},
              ${qa.ai_score || 0},
              ${qa.ai_feedback || null},
              ${qa.confidence || 'medium'},
              ${qa.response_time || 0},
              ${improvements.join(', ') || null},
              ${confidence_tips.join(', ') || null},
              ${total_score || 0},
              ${avg_score || 0},
              ${skill || null},
              ${user_first_name || null},
              ${user_last_name || null},
              ${user_email || null},
              NOW()
            )
            `;
            responsesSaved++;
          }
          }

      } catch (transactionError) {
        throw transactionError;
      }
    });

    // ✅ FIXED: Enhanced success response
    return NextResponse.json({
      success: true,
      message: 'Interview data saved successfully with user details',
      data: {
        interview_id: interviewId,
        user_id,
        user_email: user_email || null,
        user_first_name: user_first_name || null,
        user_last_name: user_last_name || null,
        quit_reason: quit_reason || null,
        questions_attempted: questions_attempted || 0,
        is_completed: is_completed || false,
        responses_saved: responsesSaved,
        skills_saved: skill || null
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Failed to save interview data to database',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
