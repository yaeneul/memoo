import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key';

// 토큰 검증 헬퍼 함수
function verifyToken(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// 1. 메모 수정 (PUT)
export async function PUT(req, { params }) {
  const user = verifyToken(req);
  if (!user) {
    return Response.json({ message: '인증되지 않은 요청입니다.' }, { status: 401 });
  }

  const memoId = params.id;
  const { text } = await req.json();

  try {
    // 본인의 메모인지 확인 후 수정
    const result = await sql`
      UPDATE memos 
      SET text = ${text} 
      WHERE id = ${memoId} AND user_id = ${user.userId}
      RETURNING *;
    `;

    if (result.rowCount === 0) {
      return Response.json({ message: '메모를 찾을 수 없거나 권한이 없습니다.' }, { status: 403 });
    }

    return Response.json(result.rows[0], { status: 200 });
  } catch (error) {
    return Response.json({ message: 'DB 에러가 발생했습니다.' }, { status: 500 });
  }
}

// 2. 메모 삭제 (DELETE)
export async function DELETE(req, { params }) {
  const user = verifyToken(req);
  if (!user) {
    return Response.json({ message: '인증되지 않은 요청입니다.' }, { status: 401 });
  }

  const memoId = params.id;

  try {
    // 본인의 메모인지 확인 후 삭제
    const result = await sql`
      DELETE FROM memos 
      WHERE id = ${memoId} AND user_id = ${user.userId}
      RETURNING *;
    `;

    if (result.rowCount === 0) {
      return Response.json({ message: '메모를 찾을 수 없거나 권한이 없습니다.' }, { status: 403 });
    }

    return Response.json({ message: '삭제 완료' }, { status: 200 });
  } catch (error) {
    return Response.json({ message: 'DB 에러가 발생했습니다.' }, { status: 500 });
  }
}
