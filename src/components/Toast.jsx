export default function Toast({ text }) {
  return (
    <div style={{
      background: '#12172A',
      color: '#fff',
      padding: '12px 14px',
      borderRadius: '14px',
      fontSize: '12.5px',
      boxShadow: '0 10px 24px rgba(0,0,0,0.3)',
      animation: 'toastIn 0.3s ease',
      lineHeight: '1.4'
    }}>
      {text}
    </div>
  );
}
