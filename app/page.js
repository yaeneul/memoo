'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [token, setToken] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [memoInput, setMemoInput] = useState('');
  const [memos, setMemos] = useState([]);

  // 초기 로딩 시 localStorage에서 토큰 및 이메일 확인
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedEmail = localStorage.getItem('email');
    if (savedToken) {
      setToken(savedToken);
      setUserEmail(savedEmail);
      fetchMemos(savedToken);
    }
  }, []);

  // 로그인 / 회원가입 제출
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    const action = isSignUp ? 'signup' : 'login';

    try {
      const res = await fetch('/api/handler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, email: emailInput, password: passwordInput }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      if (isSignUp) {
        alert('회원가입이 완료되었습니다! 로그인해 주세요.');
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
      alert('오류가 발생했습니다.');
    }
  };

  // 로그아웃
  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    setUserEmail('');
    setMemos([]);
  };

  // 메모 목록 불러오기
  const fetchMemos = async (authToken) => {
    try {
      const res = await fetch('/api/handler?action=getMemos', {
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
    if (!memoInput.trim()) return;

    try {
      const res = await fetch('/api/handler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'addMemo', text: memoInput }),
      });

      if (res.ok) {
        setMemoInput('');
        fetchMemos(token);
      }
    } catch (err) {
      alert('메모 저장 실패');
    }
  };

  // 메모 삭제
  const handleDeleteMemo = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const res = await fetch('/api/handler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'deleteMemo', id }),
      });

      if (res.ok) {
        fetchMemos(token);
      }
    } catch (err) {
      alert('메모 삭제 실패');
    }
  };

  return (
    <main style={styles.container}>
      <div style={styles.card}>
        {!token ? (
          /* 1. 로그인 / 회원가입 폼 */
          <div>
            <h2 style={styles.title}>{isSignUp ? '회원가입' : '로그인'}</h2>
            <form onSubmit={handleAuthSubmit} style={styles.form}>
              <input
                type="email"
                placeholder="이메일"
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
                {isSignUp ? '회원가입' : '로그인'}
              </button>
            </form>
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              style={{ ...styles.secondaryBtn, width: '100%', marginTop: '10px' }}
            >
              {isSignUp ? '로그인으로 전환' : '회원가입으로 전환'}
            </button>
          </div>
        ) : (
          /* 2. 로그인 성공 시 메모장 화면 */
          <div>
            <div style={styles.userInfo}>
              <span style={{ fontWeight: 'bold', color: '#555' }}>{userEmail}</span>
              <button onClick={handleLogout} style={styles.secondaryBtn}>
                로그아웃
              </button>
            </div>

            <h2 style={styles.title}>내 메모 목록</h2>
            <form onSubmit={handleAddMemo} style={styles.form}>
              <textarea
                placeholder="새로운 메모를 입력하세요..."
                value={memoInput}
                onChange={(e) => setMemoInput(e.target.value)}
                required
                style={styles.textarea}
              />
              <button type="submit" style={styles.primaryBtn}>
                메모 저장
              </button>
            </form>

            <div style={{ marginTop: '20px' }}>
              {memos.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#888' }}>작성된 메모가 없습니다.</p>
              ) : (
                memos.map((memo) => (
                  <div key={memo.id} style={styles.memoItem}>
                    <p style={styles.memoText}>{memo.text}</p>
                    <button
                      onClick={() => handleDeleteMemo(memo.id)}
                      style={styles.dangerBtn}
                    >
                      삭제
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// 기본 인라인 스타일 설정
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
  },
  card: {
    width: '100%',
    maxWidth: '450px',
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  title: {
    marginBottom: '20px',
    textAlign: 'center',
    color: '#333',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  input: {
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px',
  },
  textarea: {
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px',
    minHeight: '80px',
    resize: 'vertical',
  },
  primaryBtn: {
    padding: '12px',
    backgroundColor: '#4A90E2',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '6px 12px',
    backgroundColor: '#6c757d',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  dangerBtn: {
    padding: '6px 12px',
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  userInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: '1px solid #eee',
  },
  memoItem: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #e9ecef',
    borderRadius: '8px',
    padding: '14px',
    marginBottom: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  memoText: {
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    marginRight: '12px',
    color: '#444',
  },
};
