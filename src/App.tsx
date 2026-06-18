import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AuthPage } from './components/AuthPage';
import { Home } from './pages/Home';
import { LearningPage } from './pages/LearningPage';
import { LearningRecordPage } from './pages/LearningRecordPage';
import { RewardPage } from './pages/RewardPage';
import { MyPage } from './pages/MyPage';
import { SettingPage } from './pages/SettingPage';
import { StubPage } from './pages/StubPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/home" element={<Home />} />
          <Route path="/learning" element={<LearningPage />} />
          <Route path="/learning/pitch" element={<StubPage title="피치 맞추기" />} />
          <Route path="/learning/monster" element={<StubPage title="몬스터 대결" />} />
          <Route path="/learning/matching" element={<StubPage title="발음 카드 짝맞추기" />} />
          <Route path="/history" element={<LearningRecordPage />} />
          <Route path="/rewards" element={<RewardPage />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/settings" element={<SettingPage />} />
          <Route path="/privacy" element={<StubPage title="개인정보 처리방침" />} />
          <Route path="/support" element={<StubPage title="고객센터" />} />
          <Route path="/guide" element={<StubPage title="이용 가이드" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
