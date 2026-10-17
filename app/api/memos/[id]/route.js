import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'secret1234';

export async function DELETE(request, { params }) {
  try {
    // 1. 요청 헤더에서 JWT 인증 토큰 확인
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ message: '인증 정보가 없습니다.' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    // 2. URL 경로에서 메모 ID 가져오기
    const memoId = params.id;

    if (!memoId) {
      return NextResponse.json({ message: '삭제할 메모 ID가 필요합니다.' }, { status: 400 });
    }

    // 3. 본인의 메모만 삭제하도록 DB 처리
    const result = await sql`
      DELETE FROM memos 
      WHERE id = ${memoId} AND user_id = ${userId};
    `;

    return NextResponse.json({ message: '메모가 삭제되었습니다.' }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: '삭제 처리 중 오류가 발생했거나 권한이 없습니다.' },
      { status: 400 }
    );
  }
}
