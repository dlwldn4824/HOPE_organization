import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AuthPage } from './components/AuthPage';

const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const LearningPage = lazy(() => import('./pages/LearningPage').then((m) => ({ default: m.LearningPage })));
const PitchGamePage = lazy(() => import('./games/pitch/PitchGamePage').then((m) => ({ default: m.PitchGamePage })));
const MonsterGamePage = lazy(() => import('./games/monster/MonsterGamePage').then((m) => ({ default: m.MonsterGamePage })));
const MatchingGamePage = lazy(() => import('./games/matching/MatchingGamePage').then((m) => ({ default: m.MatchingGamePage })));
const SpeechPracticePage = lazy(() =>
  import('./pages/SpeechPracticePage').then((m) => ({ default: m.SpeechPracticePage })),
);
const LearningRecordPage = lazy(() =>
  import('./pages/LearningRecordPage').then((m) => ({ default: m.LearningRecordPage })),
);
const RewardPage = lazy(() => import('./pages/RewardPage').then((m) => ({ default: m.RewardPage })));
const EventsPage = lazy(() => import('./pages/EventsPage').then((m) => ({ default: m.EventsPage })));
const MyPage = lazy(() => import('./pages/MyPage').then((m) => ({ default: m.MyPage })));
const SettingPage = lazy(() => import('./pages/SettingPage').then((m) => ({ default: m.SettingPage })));
const GuidePage = lazy(() => import('./pages/GuidePage').then((m) => ({ default: m.GuidePage })));
const SupportPage = lazy(() => import('./pages/SupportPage').then((m) => ({ default: m.SupportPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));

function PageFallback() {
  return (
    <div className="flex h-screen items-center justify-center text-sm text-gray-400">
      불러오는 중…
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<AuthPage />} />
            <Route path="/home" element={<Home />} />
            <Route path="/learning" element={<LearningPage />} />
            <Route path="/learning/pitch" element={<PitchGamePage />} />
            <Route path="/learning/monster" element={<MonsterGamePage />} />
            <Route path="/learning/matching" element={<MatchingGamePage />} />
            <Route path="/dev/speech/pitch" element={<SpeechPracticePage mode="pitch" />} />
            <Route path="/dev/speech/monster" element={<SpeechPracticePage mode="monster" />} />
            <Route path="/dev/speech/matching" element={<SpeechPracticePage mode="matching" />} />
            <Route path="/history" element={<LearningRecordPage />} />
            <Route path="/rewards" element={<RewardPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/settings" element={<SettingPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/guide" element={<GuidePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
