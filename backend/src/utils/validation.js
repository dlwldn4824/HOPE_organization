import { z } from 'zod';
import { HttpError } from './http.js';

export function validate(schema, payload) {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path?.join('.') ?? '';
    const detail = path ? `${path}: ${issue.message}` : issue.message;
    throw new HttpError(400, `Invalid request — ${detail}`);
  }
  return parsed.data;
}

export const SignupSchema = z.object({
  username: z.string().trim().min(3).max(32),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(4).max(128),
  childNickname: z.string().trim().min(1).max(32).optional(),
  nickname: z.string().trim().min(1).max(32).optional(),
  childGender: z.enum(['male', 'female', 'other']).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
}).refine((v) => v.childNickname || v.nickname, {
  message: 'childNickname is required',
  path: ['childNickname'],
});

export const LoginSchema = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(1),
});

export const UpdateProfileSchema = z.object({
  nickname: z.string().trim().min(1).max(32).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
});

export const LearningResultSchema = z.object({
  gameId: z.string().min(1).max(32),
  targetWord: z.string().max(64).optional(),
  accuracy: z.coerce.number().min(0).max(100),
  earnedStars: z.coerce.number().int().min(1).max(5).optional(),
  durationSeconds: z.coerce.number().int().min(0).max(60 * 60 * 4).optional(),
  analysis: z.unknown().optional(),
});

export const SettingsSchema = z.object({
  notifications: z.object({
    studyNotification: z.boolean().optional(),
    attendanceNotification: z.boolean().optional(),
    rewardNotification: z.boolean().optional(),
    parentReportNotification: z.boolean().optional(),
  }).partial().optional(),
  learning: z.object({
    dailyGoalMinutes: z.number().int().min(1).max(180).optional(),
    difficulty: z.enum(['easy', 'normal', 'hard']).optional(),
    autoPhonemeRecommendation: z.boolean().optional(),
  }).partial().optional(),
  parent: z.object({
    parentEmail: z.string().email().optional(),
    weeklyReportEnabled: z.boolean().optional(),
  }).partial().optional(),
  privacy: z.object({
    voiceDataStorage: z.boolean().optional(),
  }).partial().optional(),
}).partial();

export const ChargeWalletSchema = z.object({
  currency: z.enum(['coin', 'gem']),
  packageId: z.string().min(1),
});

export const AttendanceClaimSchema = z.object({
  day: z.coerce.number().int().min(1).max(7),
});
