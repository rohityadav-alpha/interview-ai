// src/app/api/clerk/webhook/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  return NextResponse.json({ received: true });
}
