import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AuthPage } from './components/AuthPage';
import { MonsterGamePage } from './games/monster/MonsterGamePage';
import { PitchGamePage } from './games/pitch/PitchGamePage';
import { WhackGamePage } from './games/whack/WhackGamePage';
import { Home } from './pages/Home';
import { LearningPage } from './pages/LearningPage';
import { LearningRecordPage } from './pages/LearningRecordPage';
import { RewardPage } from './pages/RewardPage';
import { EventsPage } from './pages/EventsPage';
import { MyPage } from './pages/MyPage';
import { SettingPage } from './pages/SettingPage';
import { GuidePage } from './pages/GuidePage';
import { SupportPage } from './pages/SupportPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { SpeechPracticePage } from './pages/SpeechPracticePage';
import { ParentHomePage } from './pages/parent/ParentHomePage';
import { ParentAnalysisPage } from './pages/parent/ParentAnalysisPage';
import { ParentAnalysisDetailPage } from './pages/parent/ParentAnalysisDetailPage';
import { ParentRecordsPage } from './pages/parent/ParentRecordsPage';
import { ParentTherapistPage } from './pages/parent/ParentTherapistPage';
import { ParentNotificationsPage } from './pages/parent/ParentNotificationsPage';
import { ParentGrowthPage } from './pages/parent/ParentGrowthPage';
import { ParentMyPage } from './pages/parent/ParentMyPage';
import { ParentSettingsPage } from './pages/parent/ParentSettingsPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </AuthProvider>
  );
}
