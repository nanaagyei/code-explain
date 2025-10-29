// Simple test component to verify React works
export default function AppTest() {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: 'blue' }}>🎉 React is Working!</h1>
      <p>If you see this, Vite and React are configured correctly.</p>
      <p>Timestamp: {new Date().toISOString()}</p>
    </div>
  );
}
