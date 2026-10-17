import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'secret1234';

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

// 메모 전체 조회 (GET)
export async function GET(request) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ message: '인증 필요' }, { status: 401 });
  }

  try {
    const { rows } = await sql`
      SELECT * FROM memos WHERE user_id = ${userId} ORDER BY created_at DESC;
    `;
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ message: '메모 조회 중 오류 발생' }, { status: 500 });
  }
}

// 메모 생성 (POST)
export async function POST(request) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ message: '인증 필요' }, { status: 401 });
  }

  try {
    const { text } = await request.json();

    // memos 테이블이 없는 경우 자동 생성
    await sql`
      CREATE TABLE IF NOT EXISTS memos (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id),
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      INSERT INTO memos (user_id, text) VALUES (${userId}, ${text});
    `;

    return NextResponse.json({ message: '메모 저장 완료' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: '메모 저장 중 오류 발생' }, { status: 500 });
  }
}
