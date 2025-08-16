import { NextResponse } from 'next/server';
import postgres from 'postgres';

// Use existing database connection
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL!;
const client = postgres(connectionString);

// In-memory cache for recent login attempts (prevents rapid duplicates)
const recentLogins = new Map<string, number>();

export async function POST(request: Request) {
  try {
    const {
      user_id,
      email_id,
      first_name,
      last_name,
      username,
      full_name,
      login_time,
      user_agent,
      session_id
    } = await request.json();

    // ✅ STRICT VALIDATION
    if (!user_id) {
      return NextResponse.json({
        success: false,
        error: 'user_id is required'
      }, { status: 400 });
    }

    // ✅ MEMORY CACHE CHECK: Prevent rapid duplicates (within 30 seconds)
    const now = Date.now();
    const lastLoginTime = recentLogins.get(user_id);

    if (lastLoginTime && (now - lastLoginTime) < 30000) { // 30 seconds
      return NextResponse.json({
        success: true,
        message: 'Login already recorded recently (memory cache)',
        duplicate: true,
        cache_blocked: true,
        data: { user_id, last_attempt: new Date(lastLoginTime).toISOString() }
      });
    }

    // ✅ DATABASE DUPLICATE CHECK: Check for recent login (within 10 minutes)
    const recentLogin = await client`
      SELECT id, login_time, session_id
      FROM user_logins 
      WHERE user_id = ${user_id} 
        AND login_time >= NOW() - INTERVAL '10 minutes'
      ORDER BY login_time DESC 
      LIMIT 1
    `;

    if (recentLogin.length > 0) {
      // Update memory cache
      recentLogins.set(user_id, now);

      return NextResponse.json({
        success: true,
        message: 'Login already recorded recently (database)',
        duplicate: true,
        database_blocked: true,
        data: {
          existing_login_id: recentLogin[0].id,
          user_id,
          last_login_time: recentLogin[0].login_time,
          existing_session: recentLogin[0].session_id
        }
      });
    }

    // ✅ GET CLIENT IP ADDRESS
    const forwarded = request.headers.get("x-forwarded-for");
    const realIP = request.headers.get("x-real-ip");
    const clientIP = forwarded ? forwarded.split(",")[0] : realIP || 'unknown';

    // ✅ INSERT NEW LOGIN RECORD
    const loginResult = await client`
      INSERT INTO user_logins (
        user_id, email_id, first_name, last_name, username,
        full_name, login_time, user_agent, ip_address, session_id,
        created_at
      )
      VALUES (
        ${user_id}, 
        ${email_id || null}, 
        ${first_name || null}, 
        ${last_name || null}, 
        ${username || null},
        ${full_name || null}, 
        ${login_time ? new Date(login_time) : new Date()}, 
        ${user_agent || null}, 
        ${clientIP}, 
        ${session_id || null},
        NOW()
      )
      RETURNING id, created_at
    `;

    const loginId = loginResult[0]?.id;
    const createdAt = loginResult[0]?.created_at;

    // ✅ UPDATE MEMORY CACHE
    recentLogins.set(user_id, now);

    // ✅ CLEANUP OLD CACHE ENTRIES (prevent memory leak)
    const oneHourAgo = now - (60 * 60 * 1000);
    for (const [userId, timestamp] of recentLogins.entries()) {
      if (timestamp < oneHourAgo) {
        recentLogins.delete(userId);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User login data saved successfully',
      duplicate: false,
      new_entry: true,
      data: {
        login_id: loginId,
        user_id,
        email_id: email_id || null,
        first_name: first_name || null,
        last_name: last_name || null,
        login_time: login_time || new Date().toISOString(),
        session_id: session_id || null,
        ip_address: clientIP,
        created_at: createdAt
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Failed to save user login data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
