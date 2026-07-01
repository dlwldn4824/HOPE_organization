let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  void audioContext.resume();
  return audioContext;
}

/** 두더지 잡기 효과음 — 외부 파일 없이 Web Audio로 생성 */
export function playWhackCatchSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const thump = ctx.createOscillator();
    const thumpGain = ctx.createGain();
    thump.type = 'triangle';
    thump.frequency.setValueAtTime(200, now);
    thump.frequency.exponentialRampToValueAtTime(55, now + 0.1);
    thumpGain.gain.setValueAtTime(0.4, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    thump.connect(thumpGain).connect(ctx.destination);
    thump.start(now);
    thump.stop(now + 0.14);

    const pop = ctx.createOscillator();
    const popGain = ctx.createGain();
    pop.type = 'sine';
    pop.frequency.setValueAtTime(480, now + 0.03);
    pop.frequency.exponentialRampToValueAtTime(920, now + 0.12);
    popGain.gain.setValueAtTime(0.22, now + 0.03);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    pop.connect(popGain).connect(ctx.destination);
    pop.start(now + 0.03);
    pop.stop(now + 0.18);

    const sparkle = ctx.createOscillator();
    const sparkleGain = ctx.createGain();
    sparkle.type = 'square';
    sparkle.frequency.setValueAtTime(1200, now + 0.05);
    sparkle.frequency.exponentialRampToValueAtTime(1800, now + 0.1);
    sparkleGain.gain.setValueAtTime(0.06, now + 0.05);
    sparkleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    sparkle.connect(sparkleGain).connect(ctx.destination);
    sparkle.start(now + 0.05);
    sparkle.stop(now + 0.12);
  } catch {
    // 오디오 미지원 환경은 무시
  }
}
