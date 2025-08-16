import { NextResponse } from 'next/server';
import postgres from 'postgres';

// Use existing database connection
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL!;

let client: any = null;

function getClient() {
  if (!client) {
    client = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 60
    });
  }
  return client;
}

// ✅ FIXED: Helper functions moved OUTSIDE the main function
function getPerformanceRating(score: number): string {
  if (score >= 9) return 'Excellent';
  if (score >= 8) return 'Very Good';
  if (score >= 7) return 'Good';
  if (score >= 6) return 'Fair';
  if (score >= 5) return 'Needs Improvement';
  return 'Poor';
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');

  if (!userId) {
    return NextResponse.json({
      error: 'User ID is required'
    }, { status: 400 });
  }

  try {
    const client = getClient();
    // ✅ FIXED: Proper operators instead of HTML entities
    const userHistory = await client`
      SELECT 
        l.id,
        l.user_id,
        l.skill,
        l.difficulty,
        CAST(l.total_score AS INTEGER) as total_score,
        CAST(l.avg_score AS DECIMAL(4,2)) as avg_score,
        COALESCE(l.questions_attempted, 10) as questions_attempted,
        COALESCE(l.is_completed, false) as is_completed,
        l.quit_reason,
        COALESCE(l.interview_duration, 0) as interview_duration,
        l.created_at,
        l.updated_at,
        COUNT(ir.id) as responses_saved
      FROM leaderboard l
      LEFT JOIN interview_responses ir ON l.id = ir.interview_id
      WHERE l.user_id = ${userId}
      GROUP BY 
        l.id, l.user_id, l.skill, l.difficulty, l.total_score, 
        l.avg_score, l.questions_attempted, l.is_completed, 
        l.quit_reason, l.interview_duration, l.created_at, l.updated_at
      ORDER BY l.created_at DESC
      LIMIT 50
    `;

    // ✅ FIXED: Proper operators in map function
    const interviewHistory = userHistory.map((interview: any) => ({
      id: interview.id,
      user_id: interview.user_id,
      skill: interview.skill,
      difficulty: interview.difficulty,
      total_score: parseInt(interview.total_score) || 0,
      avg_score: parseFloat(interview.avg_score) || 0,
      questions_attempted: parseInt(interview.questions_attempted) || 10,
      is_completed: Boolean(interview.is_completed),
      quit_reason: interview.quit_reason,
      interview_duration: parseInt(interview.interview_duration) || 0,
      created_at: interview.created_at,
      updated_at: interview.updated_at,
      responses_saved: parseInt(interview.responses_saved) || 0,

      // ✅ Additional computed fields
      completion_percentage: Math.round(
        (parseInt(interview.questions_attempted) || 10) / 10 * 100
      ),
      performance_rating: getPerformanceRating(parseFloat(interview.avg_score) || 0),
      duration_formatted: formatDuration(parseInt(interview.interview_duration) || 0)
    }));

    // ✅ FIXED: Proper filter and reduce functions
    const summary = {
      total_interviews: interviewHistory.length,
      completed_interviews: interviewHistory.filter(i => i.is_completed).length,
      average_score: interviewHistory.length > 0 ? 
        Math.round(interviewHistory.reduce((sum, i) => sum + i.avg_score, 0) / interviewHistory.length * 10) / 10 : 0,
      best_score: Math.max(...interviewHistory.map(i => i.avg_score), 0),
      skills_practiced: [...new Set(interviewHistory.map(i => i.skill))],
      total_questions_attempted: interviewHistory.reduce((sum, i) => sum + i.questions_attempted, 0)
    };

    return NextResponse.json({
      interviews: interviewHistory,
      summary,
      user_id: userId,
      generated_at: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'private, max-age=30',
      }
    });

  } catch (error: any) {
    // ✅ Return empty state instead of error for better UX
    return NextResponse.json({
      interviews: [],
      summary: {
        total_interviews: 0,
        completed_interviews: 0,
        average_score: 0,
        best_score: 0,
        skills_practiced: [],
        total_questions_attempted: 0
      },
      user_id: userId,
      generated_at: new Date().toISOString(),
      note: "No interview history found or database temporarily unavailable"
    });
  }
}
