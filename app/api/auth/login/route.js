import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-1234';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    const { rows } = await sql`
      SELECT * FROM users WHERE email = ${email};
    `;

    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 400 });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    return NextResponse.json({ token, email: user.email });
  } catch (error) {
    return NextResponse.json({ message: '로그인 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
