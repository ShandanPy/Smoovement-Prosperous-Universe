import { z } from 'zod';

/**
 * Environment variable validation schema using Zod
 */
const envSchema = z.object({
  FIO_BASE_URL: z.string().url('FIO_BASE_URL must be a valid URL').default('https://rest.fnar.net'),
});

/**
 * Validated environment variables
 * Throws an error if required variables are missing or invalid
 */
export const env = envSchema.parse({
  FIO_BASE_URL: process.env.FIO_BASE_URL,
});

/**
 * Type for the validated environment variables
 */
export type Env = z.infer<typeof envSchema>;
