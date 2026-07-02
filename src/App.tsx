import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AuthPage } from './components/AuthPage';

const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const LearningPage = lazy(() => import('./pages/LearningPage').then((m) => ({ default: m.LearningPage })));
const PitchGamePage = lazy(() => import('./games/pitch/PitchGamePage').then((m) => ({ default: m.PitchGamePage })));
const MonsterGamePage = lazy(() => import('./games/monster/MonsterGamePage').then((m) => ({ default: m.MonsterGamePage })));
const WhackGamePage = lazy(() => import('./games/whack/WhackGamePage').then((m) => ({ default: m.WhackGamePage })));
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

const ParentHomePage = lazy(() => import('./pages/parent/ParentHomePage').then((m) => ({ default: m.ParentHomePage })));
const ParentAnalysisPage = lazy(() =>
  import('./pages/parent/ParentAnalysisPage').then((m) => ({ default: m.ParentAnalysisPage })),
);
const ParentAnalysisDetailPage = lazy(() =>
  import('./pages/parent/ParentAnalysisDetailPage').then((m) => ({ default: m.ParentAnalysisDetailPage })),
);
const ParentRecordsPage = lazy(() =>
  import('./pages/parent/ParentRecordsPage').then((m) => ({ default: m.ParentRecordsPage })),
);
const ParentTherapistPage = lazy(() =>
  import('./pages/parent/ParentTherapistPage').then((m) => ({ default: m.ParentTherapistPage })),
);
const ParentNotificationsPage = lazy(() =>
  import('./pages/parent/ParentNotificationsPage').then((m) => ({ default: m.ParentNotificationsPage })),
);
const ParentGrowthPage = lazy(() =>
  import('./pages/parent/ParentGrowthPage').then((m) => ({ default: m.ParentGrowthPage })),
);
const ParentMyPage = lazy(() => import('./pages/parent/ParentMyPage').then((m) => ({ default: m.ParentMyPage })));
const ParentSettingsPage = lazy(() =>
  import('./pages/parent/ParentSettingsPage').then((m) => ({ default: m.ParentSettingsPage })),
);

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
            <Route path="/learning/matching" element={<Navigate to="/learning" replace />} />
            <Route path="/learning/whack" element={<WhackGamePage />} />
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
            <Route path="/parent" element={<ParentHomePage />} />
            <Route path="/parent/analysis" element={<ParentAnalysisPage />} />
            <Route path="/parent/analysis/:sessionId" element={<ParentAnalysisDetailPage />} />
            <Route path="/parent/records" element={<ParentRecordsPage />} />
            <Route path="/parent/therapist" element={<ParentTherapistPage />} />
            <Route path="/parent/notifications" element={<ParentNotificationsPage />} />
            <Route path="/parent/growth" element={<ParentGrowthPage />} />
            <Route path="/parent/my" element={<ParentMyPage />} />
            <Route path="/parent/settings" element={<ParentSettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}