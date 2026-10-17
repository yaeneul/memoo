'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [token, setToken] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  // Auth States
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  // Memo & D-Day States
  const [memoType, setMemoType] = useState('MEMO');
  const [titleInput, setTitleInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [targetDateInput, setTargetDateInput] = useState('');
  const [memos, setMemos] = useState([]);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTargetDate, setEditTargetDate] = useState('');

  // Drag & Drop
  const [draggedIndex, setDraggedIndex] = useState(null);

  // 급식 데이터
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [mealData, setMealData] = useState({});
  const [inputDate, setInputDate] = useState('');
  const [inputMeal, setInputMeal] = useState('');

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

    const savedMeals = localStorage.getItem('school_meals');
    if (savedMeals) {
      try {
        setMealData(JSON.parse(savedMeals));
      } catch (e) {
        console.error('급식 데이터 로드 실패');
      }
    }

    setInputDate(getTodayString());
  }, []);

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // D-Day 계산
  const calculateDDay = (targetDateStr) => {
    if (!targetDateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDateStr);
    target.setHours(0, 0, 0, 0);

    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'D-Day';
    if (diffDays > 0) return `D-${diffDays}`;
    return `D+${Math.abs(diffDays)}`;
  };

  // 급식 저장
  const handleSaveMeal = (e) => {
    e.preventDefault();
    if (!inputDate || !inputMeal.trim()) {
      alert('날짜와 급식 내용을 입력해 주세요!');
      return;
    }
    const updatedMeals = { ...mealData, [inputDate]: inputMeal.trim() };
    setMealData(updatedMeals);
    localStorage.setItem('school_meals', JSON.stringify(updatedMeals));
    setInputMeal('');
    alert(`📅 ${inputDate} 급식이 등록되었습니다!`);
  };

  const handleDeleteMeal = (dateKey) => {
    const updatedMeals = { ...mealData };
    delete updatedMeals[dateKey];
    setMealData(updatedMeals);
    localStorage.setItem('school_meals', JSON.stringify(updatedMeals));
  };

  // Auth
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

  // Fetch Memos
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

  // 메모 / 디데이 작성
  const handleAddMemo = async (e) => {
    e.preventDefault();
    if (!contentInput.trim() && memoType === 'MEMO') {
      alert('메모 내용을 입력해 주세요!');
      return;
    }

    let fullText = '';
    if (memoType === 'DDAY') {
      if (!targetDateInput) {
        alert('목표 날짜를 선택해 주세요!');
        return;
      }
      fullText = `[DDAY:${targetDateInput}]\n[제목: ${titleInput.trim() || '디데이'}]\n${contentInput}`;
    } else {
      fullText = titleInput.trim()
        ? `[제목: ${titleInput.trim()}]\n${contentInput}`
        : contentInput;
    }

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
        setTargetDateInput('');
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

    const isDDay = selectedMemo.text?.startsWith('[DDAY:');
    let fullText = '';

    if (isDDay) {
      fullText = `[DDAY:${editTargetDate}]\n[제목: ${editTitle.trim() || '디데이'}]\n${editContent}`;
    } else {
      fullText = editTitle.trim()
        ? `[제목: ${editTitle.trim()}]\n${editContent}`
        : editContent;
    }

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

  // 삭제
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

  const handleCardClick = (memo) => {
    const parsed = parseMemoText(memo.text);
    setSelectedMemo(memo);
    setEditTitle(parsed.title || '');
    setEditContent(parsed.content || '');
    setEditTargetDate(parsed.targetDate || '');
    setIsEditing(false);
  };

  const parseMemoText = (text = '') => {
    let targetDate = null;
    let workText = text;

    if (workText.startsWith('[DDAY:')) {
      const dateEndIndex = workText.indexOf(']\n');
      if (dateEndIndex !== -1) {
        targetDate = workText.substring(6, dateEndIndex);
        workText = workText.substring(dateEndIndex + 2);
      }
    }

    if (workText.startsWith('[제목: ') && workText.includes(']\n')) {
      const titleEndIndex = workText.indexOf(']\n');
      const title = workText.substring(5, titleEndIndex);
      const content = workText.substring(titleEndIndex + 2);
      return { isDDay: !!targetDate, targetDate, title, content };
    }

    return { isDDay: !!targetDate, targetDate, title: null, content: workText };
  };

  // Drag & Drop
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const reorderedMemos = [...memos];
    const [draggedItem] = reorderedMemos.splice(draggedIndex, 1);
    reorderedMemos.splice(dropIndex, 0, draggedItem);

    setMemos(reorderedMemos);
    setDraggedIndex(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const todayStr = getTodayString();
  const todayMeal = mealData[todayStr];

  return (
    <main style={styles.container}>
      {!token ? (
        <div style={styles.authCard}>
          <div style={styles.authHeader}>
            <span style={{ fontSize: '36px' }}>📌</span>
            <h1 style={styles.authTitle}>포스트잇 메모장</h1>
            <p style={styles.authSubtitle}>소중한 기억과 디데이를 귀엽게 남겨보세요!</p>
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

          <button onClick={() => setIsSignUp(!isSignUp)} style={styles.toggleBtn}>
            {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
          </button>
        </div>
      ) : (
        <div style={styles.mainWrapper}>
          <header style={styles.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '28px' }}>📝</span>
              <h1 style={styles.headerTitle}>내 포스트잇 보드</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button onClick={() => setIsMealModalOpen(true)} style={styles.mealManageBtn}>
                🍱 식단표 등록/관리
              </button>
              <span style={styles.userBadge}>👤 {userEmail}</span>
              <button onClick={handleLogout} style={styles.logoutBtn}>
                로그아웃
              </button>
            </div>
          </header>

          <div style={styles.gridContainer}>
            {/* 오늘의 급식 카드 (수동 크기 조절 가능) */}
            <div style={styles.todayMealPostit}>
              <div style={styles.postitTape}></div>
              <h3 style={{ margin: '6px 0', fontSize: '17px', color: '#D81B60' }}>
                🍱 오늘의 급식 ({todayStr.slice(5)})
              </h3>
              <p style={{ margin: '10px 0', fontSize: '14px', color: '#333', whiteSpace: 'pre-wrap', flexGrow: 1 }}>
                {todayMeal || '오늘 등록된 급식 식단이 없습니다.\n상단의 [식단표 등록/관리]에서 추가해 보세요!'}
              </p>
              <button onClick={() => setIsMealModalOpen(true)} style={styles.mealEditMiniBtn}>
                식단표 미리 적어두기 ➔
              </button>
            </div>

            {/* 메모 및 디데이 포스트잇 카드 (수동 크기 조절 가능) */}
            {memos.map((memo, index) => {
              const { isDDay, targetDate, title, content } = parseMemoText(memo.text);
              const color = isDDay ? '#FFECB3' : postitColors[index % postitColors.length];
              const rotateDeg = (index % 3 - 1) * 2;
              const dDayBadge = isDDay ? calculateDDay(targetDate) : null;

              return (
                <div
                  key={memo.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  onClick={() => handleCardClick(memo)}
                  style={{
                    ...styles.postit,
                    backgroundColor: color,
                    transform: `rotate(${rotateDeg}deg)`,
                  }}
                >
                  <div style={styles.postitTape}></div>

                  {/* 한 줄로 정렬된 D-Day 배지 */}
                  {isDDay && (
                    <div style={styles.ddayBadge}>
                      🎯 {dDayBadge} <span style={styles.ddaySubText}>({targetDate})</span>
                    </div>
                  )}

                  {title && <h3 style={styles.postitTitle}>{title}</h3>}
                  <p style={styles.postitContent}>{content}</p>

                  <div style={styles.postitDate}>
                    {formatDate(memo.created_at || memo.createdAt)}
                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={() => setIsAddModalOpen(true)} style={styles.floatingBtn} title="새 메모/디데이 작성">
            ✏️ 새 메모 / 디데이 추가
          </button>

          {/* 식단 관리 모달 */}
          {isMealModalOpen && (
            <div style={styles.modalOverlay} onClick={() => setIsMealModalOpen(false)}>
              <div style={{ ...styles.modalContent, maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
                <div style={styles.modalHeader}>
                  <h2 style={{ margin: 0, fontSize: '18px', color: '#333' }}>🍱 날짜별 급식 식단 관리</h2>
                  <button onClick={() => setIsMealModalOpen(false)} style={styles.modalCloseBtn}>✕</button>
                </div>

                <form onSubmit={handleSaveMeal} style={{ ...styles.form, marginBottom: '20px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="date"
                      value={inputDate}
                      onChange={(e) => setInputDate(e.target.value)}
                      required
                      style={{ ...styles.input, width: '160px' }}
                    />
                    <button type="submit" style={{ ...styles.primaryBtn, backgroundColor: '#FF80AB', width: 'auto', padding: '0 16px' }}>
                      등록/수정
                    </button>
                  </div>
                  <textarea
                    placeholder="해당 날짜의 급식 메뉴를 적어주세요 (예: 백미밥, 된장국...)"
                    value={inputMeal}
                    onChange={(e) => setInputMeal(e.target.value)}
                    style={{ ...styles.textarea, minHeight: '80px' }}
                  />
                </form>

                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>📋 등록된 식단 목록</h4>
                <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.keys(mealData).length === 0 ? (
                    <p style={{ fontSize: '13px', color: '#aaa', margin: 0 }}>등록된 식단이 없습니다.</p>
                  ) : (
                    Object.keys(mealData).sort().map((dateKey) => (
                      <div key={dateKey} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#F5F5F5', borderRadius: '8px', fontSize: '13px' }}>
                        <div><strong>[{dateKey}]</strong>: {mealData[dateKey]}</div>
                        <button onClick={() => handleDeleteMeal(dateKey)} style={{ border: 'none', background: 'none', color: '#FF5252', cursor: 'pointer', fontWeight: 'bold' }}>삭제</button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 새 메모 / D-Day 추가 모달 */}
          {isAddModalOpen && (
            <div style={styles.modalOverlay} onClick={() => setIsAddModalOpen(false)}>
              <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div style={styles.modalHeader}>
                  <h2 style={{ margin: 0, fontSize: '20px', color: '#333' }}>
                    💛 새 포스트잇 만들기
                  </h2>
                  <button onClick={() => setIsAddModalOpen(false)} style={styles.modalCloseBtn}>✕</button>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setMemoType('MEMO')}
                    style={{
                      ...styles.typeTabBtn,
                      backgroundColor: memoType === 'MEMO' ? '#FFB74D' : '#E0E0E0',
                      color: memoType === 'MEMO' ? '#FFF' : '#555',
                    }}
                  >
                    📌 일반 메모
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemoType('DDAY')}
                    style={{
                      ...styles.typeTabBtn,
                      backgroundColor: memoType === 'DDAY' ? '#FF80AB' : '#E0E0E0',
                      color: memoType === 'DDAY' ? '#FFF' : '#555',
                    }}
                  >
                    🎯 디데이 (D-Day)
                  </button>
                </div>

                <form onSubmit={handleAddMemo} style={styles.form}>
                  {memoType === 'DDAY' && (
                    <div>
                      <label style={styles.label}>목표 날짜 (필수)</label>
                      <input
                        type="date"
                        value={targetDateInput}
                        onChange={(e) => setTargetDateInput(e.target.value)}
                        required
                        style={styles.input}
                      />
                    </div>
                  )}

                  <div>
                    <label style={styles.label}>제목 (선택사항)</label>
                    <input
                      type="text"
                      placeholder={memoType === 'DDAY' ? '예: 중간고사, 생일' : '제목을 입력하세요...'}
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      style={styles.input}
                    />
                  </div>

                  <div>
                    <label style={styles.label}>내용</label>
                    <textarea
                      placeholder="내용을 작성해 주세요..."
                      value={contentInput}
                      onChange={(e) => setContentInput(e.target.value)}
                      required={memoType === 'MEMO'}
                      style={styles.textarea}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button type="button" onClick={() => setIsAddModalOpen(false)} style={styles.cancelBtn}>
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

          {/* 상세 / 수정 모달 */}
          {selectedMemo && (
            <div style={styles.modalOverlay} onClick={() => setSelectedMemo(null)}>
              <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div style={styles.modalHeader}>
                  <h2 style={{ margin: 0, fontSize: '18px', color: '#333' }}>
                    {isEditing ? '✏️ 포스트잇 수정' : '📌 포스트잇 상세'}
                  </h2>
                  <button onClick={() => setSelectedMemo(null)} style={styles.modalCloseBtn}>✕</button>
                </div>

                {isEditing ? (
                  <form onSubmit={handleUpdateMemo} style={styles.form}>
                    {parseMemoText(selectedMemo.text).isDDay && (
                      <div>
                        <label style={styles.label}>목표 날짜</label>
                        <input
                          type="date"
                          value={editTargetDate}
                          onChange={(e) => setEditTargetDate(e.target.value)}
                          required
                          style={styles.input}
                        />
                      </div>
                    )}
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
                        style={styles.textarea}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <button type="button" onClick={() => setIsEditing(false)} style={styles.cancelBtn}>
                        취소
                      </button>
                      <button type="submit" style={styles.primaryBtn}>
                        저장하기 💾
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    {parseMemoText(selectedMemo.text).isDDay && (
                      <div style={{ ...styles.ddayBadge, marginBottom: '12px' }}>
                        🎯 {calculateDDay(parseMemoText(selectedMemo.text).targetDate)} <span style={styles.ddaySubText}>({parseMemoText(selectedMemo.text).targetDate})</span>
                      </div>
                    )}
                    {parseMemoText(selectedMemo.text).title && (
                      <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#222' }}>
                        {parseMemoText(selectedMemo.text).title}
                      </h3>
                    )}
                    <p style={{ fontSize: '15px', color: '#444', whiteSpace: 'pre-wrap', minHeight: '60px', margin: '0 0 16px 0' }}>
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
    minHeight: '100px',
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
  typeTabBtn: {
    flex: 1,
    padding: '10px',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 'bold',
    fontSize: '13px',
    cursor: 'pointer',
  },

  // 메인 보드
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
  mealManageBtn: {
    padding: '8px 14px',
    backgroundColor: '#FF80AB',
    color: '#FFF',
    border: 'none',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
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

  // 그리드 배치
  gridContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '24px',
    paddingBottom: '100px',
    alignItems: 'flex-start',
  },

  // 급식 카드 (수동 Resize 설정)
  todayMealPostit: {
    position: 'relative',
    padding: '20px',
    width: '240px',
    minWidth: '180px',
    minHeight: '180px',
    borderRadius: '4px 4px 16px 4px',
    backgroundColor: '#F8BBD0',
    boxShadow: '3px 6px 12px rgba(216, 27, 96, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    resize: 'both',       // 마우스로 가로/세로 자유롭게 크기 조절
    overflow: 'auto',     // resize 필수 속성
    boxSizing: 'border-box',
  },
  mealEditMiniBtn: {
    marginTop: '12px',
    padding: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    border: 'none',
    borderRadius: '8px',
    fontSize: '11px',
    color: '#880E4F',
    fontWeight: 'bold',
    cursor: 'pointer',
  },

  // 일반 포스트잇 & D-Day 카드 (수동 Resize 설정)
  postit: {
    position: 'relative',
    padding: '20px',
    width: '240px',
    minWidth: '180px',
    minHeight: '160px',
    borderRadius: '4px 4px 16px 4px',
    boxShadow: '3px 6px 12px rgba(0, 0, 0, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    resize: 'both',       // 마우스 우측 하단 모서리로 크기 자유 조절 가능
    overflow: 'auto',     // resize 필수 속성
    boxSizing: 'border-box',
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

  // D-Day 배지 한 줄 정렬 스타일
  ddayBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    alignSelf: 'flex-start',
    backgroundColor: '#E65100',
    color: '#FFF',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: 'bold',
    marginBottom: '8px',
    whiteSpace: 'nowrap', // 한 줄 유지
  },
  ddaySubText: {
    fontSize: '11px',
    fontWeight: 'normal',
    opacity: 0.85,
    whiteSpace: 'nowrap',
  },

  postitTitle: { margin: '8px 0 6px 0', fontSize: '16px', fontWeight: 'bold', color: '#222' },
  postitContent: { margin: 0, fontSize: '14px', color: '#444', whiteSpace: 'pre-wrap', wordBreak: 'break-all', flexGrow: 1 },
  postitDate: { marginTop: '16px', fontSize: '11px', color: 'rgba(0, 0, 0, 0.4)', textAlign: 'right' },

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
