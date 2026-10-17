'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [token, setToken] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  // Auth States
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  // Memo States
  const [titleInput, setTitleInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [memos, setMemos] = useState([]);
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState(null); // 클릭한 포스트잇 저장
  const [isEditing, setIsEditing] = useState(false);     // 수정 모드 여부
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // 포스트잇 파스텔 컬러 배열
  const postitColors = [
    '#FFF59D', // 파스텔 노랑
    '#FFCDD2', // 파스텔 핑크
    '#B3E5FC', // 파스텔 하늘
    '#C8E6C9', // 파스텔 연두
    '#E1BEE7', // 파스텔 보라
    '#FFE0B2', // 파스텔 주황
  ];

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedEmail = localStorage.getItem('email');
    if (savedToken) {
      setToken(savedToken);
      setUserEmail(savedEmail);
      fetchMemos(savedToken);
    }
  }, []);

  // 로그인 및 회원가입
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isSignUp ? '/api/auth/signup' : '/api/auth/login';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, password: passwordInput }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || '오류가 발생했습니다.');
        return;
      }

      if (isSignUp) {
        alert('🎉 회원가입 성공! 로그인해 주세요.');
        setIsSignUp(false);
        setPasswordInput('');
      } else {
        setToken(data.token);
        setUserEmail(data.email);
        localStorage.setItem('token', data.token);
        localStorage.setItem('email', data.email);
        fetchMemos(data.token);
      }
    } catch (err) {
      alert('연결 중 오류가 발생했습니다.');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    setUserEmail('');
    setMemos([]);
  };

  // 메모 불러오기
  const fetchMemos = async (authToken) => {
    try {
      const res = await fetch('/api/memos', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMemos(data);
      }
    } catch (err) {
      console.error('메모 불러오기 실패:', err);
    }
  };

  // 메모 작성
  const handleAddMemo = async (e) => {
    e.preventDefault();
    if (!contentInput.trim()) {
      alert('메모 내용을 입력해 주세요!');
      return;
    }

    const fullText = titleInput.trim()
      ? `[제목: ${titleInput.trim()}]\n${contentInput}`
      : contentInput;

    try {
      const res = await fetch('/api/memos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: fullText }),
      });

      if (res.ok) {
        setTitleInput('');
        setContentInput('');
        setIsAddModalOpen(false);
        fetchMemos(token);
      }
    } catch (err) {
      alert('메모 저장 실패');
    }
  };

  // 메모 수정
  const handleUpdateMemo = async (e) => {
    e.preventDefault();
    if (!editContent.trim()) {
      alert('메모 내용을 입력해 주세요!');
      return;
    }

    const fullText = editTitle.trim()
      ? `[제목: ${editTitle.trim()}]\n${editContent}`
      : editContent;

    try {
      const res = await fetch(`/api/memos/${selectedMemo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: fullText }),
      });

      if (res.ok) {
        setSelectedMemo(null);
        setIsEditing(false);
        fetchMemos(token);
      } else {
        alert('메모 수정 권한이 없거나 실패했습니다.');
      }
    } catch (err) {
      alert('메모 수정 실패');
    }
  };

  // 메모 삭제
  const handleDeleteMemo = async (id) => {
    if (!confirm('정말 이 포스트잇을 떼어낼까요? 🗑️')) return;

    try {
      const res = await fetch(`/api/memos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setSelectedMemo(null);
        fetchMemos(token);
      }
    } catch (err) {
      alert('메모 삭제 실패');
    }
  };

  // 포스트잇 클릭 시 모달 열기
  const handleCardClick = (memo) => {
    const { title, content } = parseMemoText(memo.text);
    setSelectedMemo(memo);
    setEditTitle(title || '');
    setEditContent(content);
    setIsEditing(false);
  };

  // 메모 텍스트에서 제목과 내용 분리하는 헬퍼 함수
  const parseMemoText = (text) => {
    if (text && text.startsWith('[제목: ') && text.includes(']\n')) {
      const titleEndIndex = text.indexOf(']\n');
      const title = text.substring(6, titleEndIndex);
      const content = text.substring(titleEndIndex + 2);
      return { title, content };
    }
    return { title: null, content: text || '' };
  };

  // 날짜 포맷 함수
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <main style={styles.container}>
      {!token ? (
        /* 로그인 / 회원가입 화면 */
        <div style={styles.authCard}>
          <div style={styles.authHeader}>
            <span style={{ fontSize: '36px' }}>📌</span>
            <h1 style={styles.authTitle}>포스트잇 메모장</h1>
            <p style={styles.authSubtitle}>소중한 기억들을 귀엽게 남겨보세요!</p>
          </div>

          <form onSubmit={handleAuthSubmit} style={styles.form}>
            <input
              type="email"
              placeholder="이메일 주소"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              required
              style={styles.input}
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              required
              style={styles.input}
            />
            <button type="submit" style={styles.primaryBtn}>
              {isSignUp ? '✨ 회원가입하기' : '🚀 로그인하기'}
            </button>
          </form>

          <button
            onClick={() => setIsSignUp(!isSignUp)}
            style={styles.toggleBtn}
          >
            {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
          </button>
        </div>
      ) : (
        /* 메모 메인 화면 */
        <div style={styles.mainWrapper}>
          {/* 상단 네비게이션 바 */}
          <header style={styles.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '28px' }}>📝</span>
              <h1 style={styles.headerTitle}>내 포스트잇 보드</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={styles.userBadge}>👤 {userEmail}</span>
              <button onClick={handleLogout} style={styles.logoutBtn}>
                로그아웃
              </button>
            </div>
          </header>

          {/* 포스트잇 메모 그리드 영역 */}
          <div style={styles.gridContainer}>
            {memos.length === 0 ? (
              <div style={styles.emptyBox}>
                <span style={{ fontSize: '48px', marginBottom: '12px' }}>🐣</span>
                <p style={{ margin: 0, fontSize: '18px', color: '#777', fontWeight: 'bold' }}>
                  아직 작성된 포스트잇이 없어요!
                </p>
                <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#aaa' }}>
                  오른쪽 하단의 ➕ 버튼을 눌러 첫 번째 메모를 남겨보세요.
                </p>
              </div>
            ) : (
              memos.map((memo, index) => {
                const { title, content } = parseMemoText(memo.text);
                const color = postitColors[index % postitColors.length];
                const rotateDeg = (index % 3 - 1) * 2;

                return (
                  <div
                    key={memo.id}
                    onClick={() => handleCardClick(memo)}
                    style={{
                      ...styles.postit,
                      backgroundColor: color,
                      transform: `rotate(${rotateDeg}deg)`,
                    }}
                  >
                    <div style={styles.postitTape}></div>
                    {title && <h3 style={styles.postitTitle}>{title}</h3>}
                    <p style={styles.postitContent}>{content}</p>
                    <div style={styles.postitDate}>
                      {formatDate(memo.created_at || memo.createdAt)}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 오른쪽 하단 대형 Floating 버튼 */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            style={styles.floatingBtn}
            title="새 메모 작성하기"
          >
            ✏️ 새 메모 추가
          </button>

          {/* 새 메모 작성 모달 */}
          {isAddModalOpen && (
            <div style={styles.modalOverlay} onClick={() => setIsAddModalOpen(false)}>
              <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div style={styles.modalHeader}>
                  <h2 style={{ margin: 0, fontSize: '20px', color: '#333' }}>
                    💛 새 포스트잇 쓰기
                  </h2>
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    style={styles.modalCloseBtn}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddMemo} style={styles.form}>
                  <div>
                    <label style={styles.label}>제목 (선택사항)</label>
                    <input
                      type="text"
                      placeholder="제목을 입력하세요..."
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      style={styles.input}
                    />
                  </div>

                  <div>
                    <label style={styles.label}>내용 (필수)</label>
                    <textarea
                      placeholder="기억할 내용을 자유롭게 작성하세요..."
                      value={contentInput}
                      onChange={(e) => setContentInput(e.target.value)}
                      required
                      style={styles.textarea}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      style={styles.cancelBtn}
                    >
                      취소
                    </button>
                    <button type="submit" style={styles.primaryBtn}>
                      붙이기 📌
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 클릭 시 작동하는 수정/삭제 상세 모달 */}
          {selectedMemo && (
            <div style={styles.modalOverlay} onClick={() => setSelectedMemo(null)}>
              <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div style={styles.modalHeader}>
                  <h2 style={{ margin: 0, fontSize: '18px', color: '#333' }}>
                    {isEditing ? '✏️ 포스트잇 수정하기' : '📌 포스트잇 상세'}
                  </h2>
                  <button
                    onClick={() => setSelectedMemo(null)}
                    style={styles.modalCloseBtn}
                  >
                    ✕
                  </button>
                </div>

                {isEditing ? (
                  /* 수정 모드 폼 */
                  <form onSubmit={handleUpdateMemo} style={styles.form}>
                    <div>
                      <label style={styles.label}>제목</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        style={styles.input}
                      />
                    </div>
                    <div>
                      <label style={styles.label}>내용</label>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        required
                        style={styles.textarea}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        style={styles.cancelBtn}
                      >
                        취소
                      </button>
                      <button type="submit" style={styles.primaryBtn}>
                        저장하기 💾
                      </button>
                    </div>
                  </form>
                ) : (
                  /* 보기 모드 (선택 메뉴) */
                  <div>
                    {parseMemoText(selectedMemo.text).title && (
                      <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#222' }}>
                        {parseMemoText(selectedMemo.text).title}
                      </h3>
                    )}
                    <p style={{ fontSize: '15px', color: '#444', whiteSpace: 'pre-wrap', minHeight: '80px', margin: '0 0 16px 0' }}>
                      {parseMemoText(selectedMemo.text).content}
                    </p>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '20px', textAlign: 'right' }}>
                      작성일: {formatDate(selectedMemo.created_at || selectedMemo.createdAt)}
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => setIsEditing(true)}
                        style={{ ...styles.primaryBtn, backgroundColor: '#4FC3F7', boxShadow: 'none' }}
                      >
                        ✏️ 수정하기
                      </button>
                      <button
                        onClick={() => handleDeleteMemo(selectedMemo.id)}
                        style={{ ...styles.cancelBtn, backgroundColor: '#FF7043', color: '#FFF' }}
                      >
                        🗑️ 삭제하기
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#F7F5F0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authCard: {
    width: '100%',
    maxWidth: '380px',
    backgroundColor: '#FFFFFF',
    padding: '36px 28px',
    borderRadius: '24px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
    textAlign: 'center',
  },
  authHeader: { marginBottom: '24px' },
  authTitle: { margin: '8px 0 4px 0', fontSize: '24px', color: '#333', fontWeight: '800' },
  authSubtitle: { margin: 0, fontSize: '13px', color: '#888' },
  form: { display: 'flex', flexDirection: 'column', gap: '14px' },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1.5px solid #EAEAEA',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#FAFAFA',
  },
  textarea: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1.5px solid #EAEAEA',
    fontSize: '14px',
    minHeight: '120px',
    resize: 'vertical',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#FAFAFA',
  },
  label: { display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '6px', textAlign: 'left' },
  primaryBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#FFB74D',
    color: '#FFF',
    border: 'none',
    borderRadius: '12px',
    fontWeight: 'bold',
    fontSize: '15px',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(255, 183, 77, 0.3)',
  },
  cancelBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#E0E0E0',
    color: '#555',
    border: 'none',
    borderRadius: '12px',
    fontWeight: 'bold',
    fontSize: '15px',
    cursor: 'pointer',
  },
  toggleBtn: {
    marginTop: '16px',
    background: 'none',
    border: 'none',
    color: '#FF9800',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },

  // 메인 보드 스타일
  mainWrapper: { width: '100%', minHeight: '100vh', padding: '24px 32px', boxSizing: 'border-box' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '20px',
    borderBottom: '2px dashed #E0DCD3',
    marginBottom: '28px',
  },
  headerTitle: { margin: 0, fontSize: '22px', fontWeight: '800', color: '#444' },
  userBadge: { fontSize: '13px', backgroundColor: '#FFF', padding: '8px 14px', borderRadius: '20px', color: '#666', border: '1px solid #E8E4D9' },
  logoutBtn: {
    padding: '8px 14px',
    backgroundColor: '#FF7043',
    color: '#FFF',
    border: 'none',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },

  // 그리드 & 포스트잇
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '24px',
    paddingBottom: '100px',
  },
  postit: {
    position: 'relative',
    padding: '20px',
    minHeight: '200px',
    borderRadius: '4px 4px 16px 4px',
    boxShadow: '3px 6px 12px rgba(0, 0, 0, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    cursor: 'pointer',
  },
  postitTape: {
    position: 'absolute',
    top: '-10px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '60px',
    height: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  postitTitle: { margin: '8px 0 6px 0', fontSize: '16px', fontWeight: 'bold', color: '#222' },
  postitContent: { margin: 0, fontSize: '14px', color: '#444', whiteSpace: 'pre-wrap', wordBreak: 'break-all', flexGrow: 1 },
  postitDate: { marginTop: '12px', fontSize: '11px', color: 'rgba(0, 0, 0, 0.4)', textAlign: 'right' },

  emptyBox: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '80px 20px',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: '20px',
    border: '2px dashed #DDD8CC',
  },

  // 오른쪽 하단 Floating 버튼
  floatingBtn: {
    position: 'fixed',
    bottom: '32px',
    right: '32px',
    padding: '16px 28px',
    backgroundColor: '#4FC3F7',
    color: '#FFF',
    border: 'none',
    borderRadius: '40px',
    fontSize: '17px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 8px 20px rgba(79, 195, 247, 0.45)',
    zIndex: 100,
  },
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFF',
    padding: '24px',
    borderRadius: '20px',
    width: '90%',
    maxWidth: '400px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
  },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  modalCloseBtn: { background: 'none', border: 'none', fontSize: '18px', color: '#888', cursor: 'pointer' },
};
