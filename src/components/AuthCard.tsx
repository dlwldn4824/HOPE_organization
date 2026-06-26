import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { AuthTab, LoginFormData, SignupFormData, SignupFormErrors } from '../types/auth';

interface AuthCardProps {
  activeTab: AuthTab;
  onTabChange: (tab: AuthTab) => void;
}

const initialLoginForm: LoginFormData = {
  identifier: 'demo',
  password: 'hope1234',
  keepLoggedIn: false,
};

const initialSignupForm: SignupFormData = {
  username: '',
  email: '',
  password: '',
  passwordConfirm: '',
  childNickname: '',
  childBirthDate: '',
  childGender: '',
  agreeTerms: false,
};

export function AuthCard({ activeTab, onTabChange }: AuthCardProps) {
  const navigate = useNavigate();
  const { login, loginWithCredentials, signupWithForm } = useAuth();
  const [loginForm, setLoginForm] = useState<LoginFormData>(initialLoginForm);
  const [signupForm, setSignupForm] = useState<SignupFormData>(initialSignupForm);
  const [signupErrors, setSignupErrors] = useState<SignupFormErrors>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupPasswordConfirm, setShowSignupPasswordConfirm] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);

    try {
      await loginWithCredentials(loginForm.identifier, loginForm.password);
      navigate('/home');
    } catch (caught) {
      setAuthError(caught instanceof Error ? caught.message : '로그인에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateSignup = () => {
    const errors: SignupFormErrors = {};

    if (!signupForm.username.trim()) errors.username = '아이디를 입력해주세요.';
    if (!signupForm.email.trim()) errors.email = '이메일을 입력해주세요.';
    if (!signupForm.password) errors.password = '비밀번호를 입력해주세요.';
    if (!signupForm.passwordConfirm) errors.passwordConfirm = '비밀번호 확인을 입력해주세요.';
    if (signupForm.password !== signupForm.passwordConfirm) {
      errors.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    }
    if (!signupForm.childNickname.trim()) errors.childNickname = '아이 닉네임을 입력해주세요.';
    if (!signupForm.childBirthDate) errors.childBirthDate = '아이 생년월일을 선택해주세요.';
    if (!signupForm.childGender) errors.childGender = '아이 성별을 선택해주세요.';
    if (!signupForm.agreeTerms) errors.agreeTerms = '필수 약관에 동의해주세요.';

    setSignupErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignup()) return;
    setAuthError(null);
    setIsSubmitting(true);

    try {
      await signupWithForm(signupForm);
      navigate('/home');
    } catch (caught) {
      setAuthError(caught instanceof Error ? caught.message : '회원가입에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = () => {
    login();
    navigate('/home');
  };

  const inputClass =
    'h-12 w-full rounded-xl border border-hope-border bg-white px-3 pl-9 text-sm text-hope-text outline-none transition-all placeholder:text-gray-400 focus:border-hope-green focus:ring-2 focus:ring-hope-green/20';
  const inputClassPlain =
    'h-12 w-full rounded-xl border border-hope-border bg-white px-3 text-sm text-hope-text outline-none transition-all placeholder:text-gray-400 focus:border-hope-green focus:ring-2 focus:ring-hope-green/20';
  const submitButtonClass =
    'h-11 w-full rounded-xl bg-gradient-to-r from-hope-green to-hope-green-dark text-sm font-bold text-white shadow-md transition-all hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60';
  const socialButtonClass =
    'flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-hope-border bg-white text-sm font-semibold text-hope-text transition-all hover:bg-gray-50 active:scale-[0.99]';

  return (
    <div className="flex h-full max-h-full min-h-0 w-full max-w-[400px] flex-col overflow-hidden rounded-[26px] bg-white shadow-xl">
      <div className="shrink-0 border-b border-hope-border p-[1.6rem] pb-0">
        <div className="flex">
          <TabButton active={activeTab === 'login'} onClick={() => onTabChange('login')}>
            로그인
          </TabButton>
          <TabButton active={activeTab === 'signup'} onClick={() => onTabChange('signup')}>
            회원가입
          </TabButton>
        </div>
      </div>

      {activeTab === 'login' ? (
        <form onSubmit={handleLoginSubmit} className="min-h-0 overflow-y-auto">
          <div className="p-[1.6rem] pt-4">
            <div className="space-y-3">
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  className={inputClass}
                  placeholder="아이디 또는 이메일"
                  value={loginForm.identifier}
                  onChange={(e) => setLoginForm({ ...loginForm, identifier: e.target.value })}
                />
              </div>

              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  className={`${inputClass} pr-10`}
                  placeholder="비밀번호"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                />
                <PasswordToggle show={showLoginPassword} onToggle={() => setShowLoginPassword((v) => !v)} />
              </div>

              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-hope-sub">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-hope-border accent-hope-green"
                  checked={loginForm.keepLoggedIn}
                  onChange={(e) => setLoginForm({ ...loginForm, keepLoggedIn: e.target.checked })}
                />
                로그인 상태 유지
              </label>

              <button type="submit" disabled={isSubmitting} className={submitButtonClass}>
                {isSubmitting ? '로그인 중' : '로그인'}
              </button>

              {authError && <ErrorMessage>{authError}</ErrorMessage>}

              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-hope-border" />
                <span className="text-xs text-hope-sub">또는</span>
                <div className="h-px flex-1 bg-hope-border" />
              </div>

              <button type="button" className={socialButtonClass} onClick={handleSocialLogin}>
                <span className="text-base font-bold text-red-500">G</span>
                Google로 데모 로그인
              </button>

              <button type="button" className={socialButtonClass} onClick={handleSocialLogin}>
                <span className="text-base"></span>
                Apple로 데모 로그인
              </button>
            </div>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSignupSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto p-[1.6rem] py-3">
            <div className="space-y-2">
              <Field label="아이디" error={signupErrors.username}>
                <input
                  type="text"
                  className={inputClassPlain}
                  placeholder="아이디"
                  value={signupForm.username}
                  onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })}
                />
              </Field>

              <Field label="이메일" error={signupErrors.email}>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    className={inputClass}
                    placeholder="이메일"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  />
                </div>
              </Field>

              <Field label="비밀번호" error={signupErrors.password}>
                <PasswordInput
                  value={signupForm.password}
                  onChange={(v) => setSignupForm({ ...signupForm, password: v })}
                  show={showSignupPassword}
                  onToggle={() => setShowSignupPassword((s) => !s)}
                  inputClass={inputClass}
                />
              </Field>

              <Field label="비밀번호 확인" error={signupErrors.passwordConfirm}>
                <PasswordInput
                  value={signupForm.passwordConfirm}
                  onChange={(v) => setSignupForm({ ...signupForm, passwordConfirm: v })}
                  show={showSignupPasswordConfirm}
                  onToggle={() => setShowSignupPasswordConfirm((s) => !s)}
                  inputClass={inputClass}
                  placeholder="비밀번호 확인"
                />
              </Field>

              <Field label="아이 닉네임" error={signupErrors.childNickname}>
                <input
                  type="text"
                  className={inputClassPlain}
                  placeholder="아이 닉네임"
                  value={signupForm.childNickname}
                  onChange={(e) => setSignupForm({ ...signupForm, childNickname: e.target.value })}
                />
              </Field>

              <Field label="아이 생년월일" error={signupErrors.childBirthDate}>
                <input
                  type="date"
                  className={inputClassPlain}
                  value={signupForm.childBirthDate}
                  onChange={(e) => setSignupForm({ ...signupForm, childBirthDate: e.target.value })}
                />
              </Field>

              <Field label="아이 성별" error={signupErrors.childGender}>
                <div className="flex gap-2.5">
                  <GenderButton
                    label="남아"
                    selected={signupForm.childGender === 'male'}
                    onClick={() => setSignupForm({ ...signupForm, childGender: 'male' })}
                  />
                  <GenderButton
                    label="여아"
                    selected={signupForm.childGender === 'female'}
                    onClick={() => setSignupForm({ ...signupForm, childGender: 'female' })}
                  />
                </div>
              </Field>

              <label className="flex cursor-pointer items-start gap-1.5 text-xs text-hope-sub">
                <input
                  type="checkbox"
                  className="mt-0.5 h-3.5 w-3.5 rounded border-hope-border accent-hope-green"
                  checked={signupForm.agreeTerms}
                  onChange={(e) => setSignupForm({ ...signupForm, agreeTerms: e.target.checked })}
                />
                <span>서비스 이용약관 및 개인정보 처리방침에 동의합니다.</span>
              </label>
              {signupErrors.agreeTerms && <p className="text-xs text-red-500">{signupErrors.agreeTerms}</p>}
            </div>
          </div>

          <div className="shrink-0 border-t border-hope-border/60 bg-white p-[1.6rem] py-3">
            <button type="submit" disabled={isSubmitting} className={submitButtonClass}>
              {isSubmitting ? '가입 중' : '회원가입'}
            </button>
            {authError && <ErrorMessage>{authError}</ErrorMessage>}
          </div>
        </form>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`relative flex-1 pb-3 text-base font-semibold transition-colors ${
        active ? 'text-hope-green' : 'text-hope-sub hover:text-hope-text'
      }`}
      onClick={onClick}
    >
      {children}
      {active && <span className="absolute bottom-0 left-0 h-[2px] w-full rounded-full bg-hope-green" />}
    </button>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-0.5 block text-[11px] font-medium text-hope-text sm:text-xs">{label}</label>
      {children}
      {error && <p className="mt-0.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  show,
  onToggle,
  inputClass,
  placeholder = '비밀번호',
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  inputClass: string;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type={show ? 'text' : 'password'}
        className={`${inputClass} pr-10`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <PasswordToggle show={show} onToggle={onToggle} />
    </div>
  );
}

function PasswordToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-hope-green"
      onClick={onToggle}
      aria-label={show ? '비밀번호 숨기기' : '비밀번호 보기'}
    >
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}

function GenderButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 flex-1 rounded-xl border text-xs font-semibold transition-all active:scale-[0.99] ${
        selected
          ? 'border-hope-green bg-hope-green-light text-hope-green'
          : 'border-hope-border bg-white text-hope-sub hover:border-hope-green/50'
      }`}
    >
      {label}
    </button>
  );
}

function ErrorMessage({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-500">{children}</p>;
}
