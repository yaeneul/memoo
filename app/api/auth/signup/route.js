import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // users 테이블 자동 생성
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password TEXT NOT NULL
      );
    `;

    const hashedPassword = await bcrypt.hash(password, 10);
    await sql`
      INSERT INTO users (email, password)
      VALUES (${email}, ${hashedPassword});
    `;

    return NextResponse.json({ message: '회원가입 성공' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: '이미 존재하는 이메일이거나 오류가 발생했습니다.' }, { status: 400 });
  }
}
