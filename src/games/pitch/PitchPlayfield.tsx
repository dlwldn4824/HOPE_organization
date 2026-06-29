import { mapPitchToStaffY } from '../shared/gameScoring';
import { getClosestNoteLabel, PITCH_SCALE_NOTES } from './pitchNotes';

interface PitchPlayfieldProps {
  ballHz: number | null;
  targetHz: number;
  minHz: number;
  maxHz: number;
  pathProgress: number;
  showGood: boolean;
}

const FIELD_HEIGHT = 320;

export function PitchPlayfield({
  ballHz,
  targetHz,
  minHz,
  maxHz,
  pathProgress,
  showGood,
}: PitchPlayfieldProps) {
  const targetY = mapPitchToStaffY(targetHz, minHz, maxHz, FIELD_HEIGHT);
  const ballY = ballHz ? mapPitchToStaffY(ballHz, minHz, maxHz, FIELD_HEIGHT) : FIELD_HEIGHT * 0.55;
  const ballX = 14 + pathProgress * 68;
  const targetNote = getClosestNoteLabel(targetHz);

  return (
    <section className="relative mx-auto mt-4 w-full max-w-[900px] overflow-hidden rounded-[32px] shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-200 to-sky-100" />
      <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-emerald-400 via-emerald-300 to-transparent" />
      <div className="absolute bottom-[18%] left-[8%] h-24 w-40 rounded-full bg-emerald-500/50 blur-2xl" />
      <div className="absolute bottom-[12%] right-[10%] h-28 w-48 rounded-full bg-emerald-600/40 blur-2xl" />

      <div className="absolute left-3 top-1/2 z-10 flex -translate-y-1/2 flex-col items-center gap-1.5 rounded-3xl bg-white/35 px-2 py-3 backdrop-blur-sm sm:left-5 sm:gap-2 sm:px-3">
        {PITCH_SCALE_NOTES.map((note) => {
          const isTarget = note.label === targetNote;
          return (
            <div key={note.label} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-black text-white shadow-sm sm:h-9 sm:w-9 sm:text-xs ${
                  isTarget ? 'ring-4 ring-white/90 ring-offset-2 ring-offset-transparent' : ''
                }`}
                style={{ backgroundColor: note.color }}
              >
                {note.label.length === 1 ? note.label : ''}
              </div>
              <span className="hidden text-[11px] font-bold text-white drop-shadow sm:inline">{note.label}</span>
            </div>
          );
        })}
        <div className="absolute -right-3 top-6 bottom-6 w-1 rounded-full bg-sky-200/80" />
      </div>

      <div className="relative h-[360px] px-16 sm:px-24 sm:h-[400px]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 400" preserveAspectRatio="none">
          {[0, 1, 2, 3, 4].map((line) => {
            const y = 95 + line * 44;
            return (
              <line
                key={line}
                x1="120"
                y1={y}
                x2="760"
                y2={y}
                stroke="rgba(255,255,255,0.92)"
                strokeWidth="4"
                strokeLinecap="round"
              />
            );
          })}

          <path
            d="M 150 250 C 280 180, 360 300, 500 220 S 700 260, 720 230"
            fill="none"
            stroke="rgba(255,255,255,0.75)"
            strokeWidth="3"
            strokeDasharray="10 12"
            strokeLinecap="round"
          />

          {[220, 260, 210, 280].map((y, index) => (
            <text
              key={index}
              x={250 + index * 130}
              y={y}
              fill="rgba(255,255,255,0.55)"
              fontSize="28"
            >
              ♪
            </text>
          ))}
        </svg>

        <div
          className="absolute z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-amber-300 shadow-[0_0_24px_rgba(250,204,21,0.9)] sm:h-16 sm:w-16"
          style={{
            left: `${88}%`,
            top: `${((targetY + 48) / FIELD_HEIGHT) * 72 + 14}%`,
          }}
        >
          <span className="text-2xl text-white">♪</span>
        </div>

        <div
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-all duration-100"
          style={{
            left: `${ballX}%`,
            top: `${((ballY + 48) / FIELD_HEIGHT) * 72 + 14}%`,
          }}
        >
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-amber-300/40 shadow-[0_0_20px_rgba(255,255,255,0.85)] sm:h-[72px] sm:w-[72px]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-hope-green shadow-md sm:h-14 sm:w-14">
              <div className="h-8 w-8 rounded-full border-2 border-white/70 bg-[linear-gradient(135deg,#2f9e44_25%,#ffffff_25%,#ffffff_50%,#2f9e44_50%,#2f9e44_75%,#ffffff_75%)] bg-[length:8px_8px]" />
            </div>
            <span className="absolute -bottom-1 -right-1 text-xl">👆</span>
          </div>
        </div>

        {showGood ? (
          <div className="absolute right-[8%] top-[8%] z-30 animate-[fadeIn_0.25s_ease-out]">
            <div className="relative rounded-3xl bg-white px-6 py-3 shadow-lg">
              <p className="text-2xl font-black text-hope-green sm:text-3xl">GOOD!</p>
              <span className="absolute -right-2 -top-2 text-lg">✨</span>
              <span className="absolute -left-2 top-1 text-sm">✨</span>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
