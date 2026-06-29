import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AuthPage } from './components/AuthPage';
import { MatchingGamePage } from './games/matching/MatchingGamePage';
import { MonsterGamePage } from './games/monster/MonsterGamePage';
import { PitchGamePage } from './games/pitch/PitchGamePage';
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
      </BrowserRouter>
    </AuthProvider>
  );
}
