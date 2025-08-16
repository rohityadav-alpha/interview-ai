import { NextRequest, NextResponse } from "next/server";
import postgres from 'postgres';

// ✅ Same database setup as your working code
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");

    const client = getClient();

    // ✅ OPTION 1: Personal Stats (with user_id) - Same as your working logic
    if (user_id) {
      // ✅ Same query structure as your working code
      const result = await client`
        SELECT
          id, user_id, skill, difficulty,
          CAST(total_score AS INTEGER) as total_score,
          CAST(avg_score AS DECIMAL(4,2)) as avg_score,
          created_at,
          COALESCE(user_email, '') as user_email,
          COALESCE(user_first_name, '') as user_first_name,
          COALESCE(user_last_name, '') as user_last_name,
          COALESCE(user_username, '') as user_username,
          COALESCE(questions_attempted, 10) as questions_attempted,
          COALESCE(is_completed, false) as is_completed,
          COALESCE(interview_duration, 0) as interview_duration,
          COALESCE(quit_reason, null) as quit_reason
        FROM leaderboard
        WHERE user_id = ${user_id}
        ORDER BY created_at DESC
        LIMIT 50
      `;

      // ✅ Same transformation as your working code
      const transformedPersonalStats = result.map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        skill: row.skill,
        difficulty: row.difficulty,
        total_score: parseInt(row.total_score) || 0,
        avg_score: parseFloat(row.avg_score) || 0,
        questions_attempted: parseInt(row.questions_attempted) || 10,
        is_completed: Boolean(row.is_completed),
        interview_duration: parseInt(row.interview_duration) || 0,
        created_at: row.created_at,
        user_email: row.user_email || '',
        user_first_name: row.user_first_name || '',
        user_last_name: row.user_last_name || '',
        user_username: row.user_username || '',
        quit_reason: row.quit_reason
      }));

      // ✅ Return format for leaderboard page
      return NextResponse.json({
        success: true,
        personalStats: transformedPersonalStats,
        globalLeaderboard: [],
        message: `Personal stats for user ${user_id}`
      });
    }

    // ✅ OPTION 2: Global Leaderboard (no user_id) - NEW but following your pattern
    const globalResult = await client`
      SELECT DISTINCT ON (user_id, skill, difficulty)
        id, user_id, skill, difficulty,
        CAST(total_score AS INTEGER) as total_score,
        CAST(avg_score AS DECIMAL(4,2)) as avg_score,
        created_at,
        COALESCE(user_email, '') as user_email,
        COALESCE(user_first_name, '') as user_first_name,
        COALESCE(user_last_name, '') as user_last_name,
        COALESCE(user_username, '') as user_username,
        COALESCE(questions_attempted, 10) as questions_attempted,
        COALESCE(is_completed, false) as is_completed
      FROM leaderboard
      WHERE is_completed = true
      ORDER BY user_id, skill, difficulty, avg_score DESC, created_at DESC
      LIMIT 6
    `;

    const transformedGlobalLeaderboard = globalResult
      .sort((a: any, b: any) => {
        if (b.avg_score !== a.avg_score) return b.avg_score - a.avg_score;
        return b.total_score - a.total_score;
      })
      .map((row: any, index: number) => ({
        id: row.id,
        user_id: row.user_id,
        skill: row.skill,
        difficulty: row.difficulty,
        total_score: parseInt(row.total_score) || 0,
        avg_score: parseFloat(row.avg_score) || 0,
        questions_attempted: parseInt(row.questions_attempted) || 10,
        is_completed: Boolean(row.is_completed),
        created_at: row.created_at,
        user_email: row.user_email || '',
        user_first_name: row.user_first_name || '',
        user_last_name: row.user_last_name || '',
        user_username: row.user_username || '',
        global_rank: index + 1,
        interview_count: 1
      }));

    return NextResponse.json({
      success: true,
      globalLeaderboard: transformedGlobalLeaderboard,
      personalStats: [],
      message: "Global leaderboard data"
    });

  } catch (error: any) {
    return NextResponse.json(
      { 
        error: "Failed to fetch leaderboard data", 
        details: error.message 
      },
      { status: 500 }
    );
  }
}
