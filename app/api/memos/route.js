import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-1234';

function getUserId(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.userId;
  } catch {
    return null;
  }
}

// 메모 조회
export async function GET(request) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ message: '인증 필요' }, { status: 40
