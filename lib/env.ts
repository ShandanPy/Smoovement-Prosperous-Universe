import { z } from 'zod';

/**
 * Environment variable validation schema using Zod
 */
const envSchema = z.object({
  FIO_BASE_URL: z.string().url('FIO_BASE_URL must be a valid URL').default('https://rest.fnar.net'),
  FIO_API_KEY: z.string().min(1, 'FIO_API_KEY is required'),
  PU_USERNAME: z.string().min(1, 'PU_USERNAME is required'),
  MAINT_TOKEN: z.string().min(1, 'MAINT_TOKEN is required'),
});

/**
 * Get validated environment variables
 * Throws an error if required variables are missing or invalid
 */
function getEnv() {
  // During build time, return defaults to allow compilation
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
    return {
      FIO_BASE_URL: 'https://rest.fnar.net',
      FIO_API_KEY: '',
      PU_USERNAME: '',
      MAINT_TOKEN: '',
    };
  }

  return envSchema.parse({
    FIO_BASE_URL: process.env.FIO_BASE_URL,
    FIO_API_KEY: process.env.FIO_API_KEY,
    PU_USERNAME: process.env.PU_USERNAME,
    MAINT_TOKEN: process.env.MAINT_TOKEN,
  });
}

// Lazy validation - only validate when accessed
let _env: z.infer<typeof envSchema> | null = null;

export const env = new Proxy({} as z.infer<typeof envSchema>, {
  get(target, prop) {
    if (_env === null) {
      _env = getEnv();
    }
    return _env[prop as keyof typeof _env];
  },
});

/**
 * Type for the validated environment variables
 */
export type Env = z.infer<typeof envSchema>;
