import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const bool = z
  .union([z.boolean(), z.string()])
  .transform((v) => (typeof v === 'boolean' ? v : ['true', '1', 'yes'].includes(v.toLowerCase())));

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_DAYS: z.coerce.number().int().positive().default(7),

  COOKIE_SECURE: bool.default('false'),
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),

  LOGIN_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  LOGIN_LOCK_MINUTES: z.coerce.number().int().positive().default(15),
  REQUIRE_EMAIL_VERIFICATION: bool.default('false'),
  AI_PROVIDER: z.enum(['none', 'openai_compatible']).default('none'),
  AI_API_KEY: z.string().optional().default(''),
  AI_BASE_URL: z.string().optional().default('https://api.openai.com/v1'),
  AI_MODEL: z.string().optional().default('gpt-4o-mini'),
  ENABLE_SCHEDULER: bool.default('true'),
  STORAGE_PROVIDER: z.enum(['local', 'cloudinary']).default('local'),
  SERVER_URL: z.string().optional().default(''),
  MAX_UPLOAD_MB: z.coerce.number().min(0.1).max(25).default(5),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),
  BOOKING_HOLD_DAYS: z.coerce.number().int().min(1).max(60).default(3),

  EMAIL_HOST: z.string().optional().default(''),
  EMAIL_PORT: z.coerce.number().int().positive().default(587),
  EMAIL_SECURE: bool.default('false'),
  EMAIL_USER: z.string().optional().default(''),
  EMAIL_PASSWORD: z.string().optional().default(''),
  EMAIL_FROM: z.string().default('Digital Hostel <no-reply@example.com>'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  console.error(`\n[config] Invalid environment configuration:\n${details}\n`);
  console.error('[config] Copy server/.env.example to server/.env and fill in the required values.\n');
  process.exit(1);
}

const env = parsed.data;

if (env.JWT_SECRET === env.JWT_REFRESH_SECRET) {
  console.error('[config] JWT_SECRET and JWT_REFRESH_SECRET must be different.');
  process.exit(1);
}
if (env.COOKIE_SAMESITE === 'none' && !env.COOKIE_SECURE) {
  console.error('[config] COOKIE_SAMESITE=none requires COOKIE_SECURE=true.');
  process.exit(1);
}

if (env.STORAGE_PROVIDER === 'cloudinary' && !(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET)) {
  console.error('[config] STORAGE_PROVIDER=cloudinary requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.');
  process.exit(1);
}

if (env.AI_PROVIDER !== 'none' && !env.AI_API_KEY) {
  console.error('[config] AI_PROVIDER is set but AI_API_KEY is empty.');
  process.exit(1);
}

export const config = Object.freeze({
  ...env,
  isProd: env.NODE_ENV === 'production',
  isDev: env.NODE_ENV === 'development',
  emailEnabled: Boolean(env.EMAIL_HOST),
  clientOrigin: new URL(env.CLIENT_URL).origin,
});
