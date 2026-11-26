import { z } from 'zod';

const POSTGRES_SCHEMES = /^postgres(ql)?:\/\//;
const WEB_SCHEMES = /^https?:\/\//;

/** Catches the two addresses being swapped, which otherwise only shows up as rejected sign-ins. */
const databaseUrl = z.string().regex(POSTGRES_SCHEMES, 'must be a postgresql:// connection string');
const supabaseUrl = z
  .url()
  .regex(WEB_SCHEMES, 'must be the https:// address of the Supabase project');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  DATABASE_URL: databaseUrl,
  SUPABASE_URL: supabaseUrl,
  SUPABASE_SECRET_KEY: z.string().min(20).optional(),
  CORS_ORIGINS: z
    .string()
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.url()).min(1)),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const fields = parsed.error.issues
      .map((issue) => `${issue.path.join('.')} ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${fields}`);
  }

  return parsed.data;
}

export const env = loadEnv();

export const isProduction = env.NODE_ENV === 'production';
