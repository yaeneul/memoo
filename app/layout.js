export const metadata = {
  title: '나만의 메모장',
  description: 'Vercel Postgres 기반의 개인 메모 웹 앱',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#f4f6f8', fontFamily: 'sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
