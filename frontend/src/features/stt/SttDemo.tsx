// src/features/stt/SttDemo.tsx
import { SttProvider, SttButton, Transcript } from '.';

export default function SttDemo() {
  return (
    <SttProvider>
      <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
        <h1>🔊 STT 기능 데모</h1>
        <SttButton />
        <div style={{ marginTop: 20 }}>
          <Transcript />
        </div>
      </div>
    </SttProvider>
  );
}
