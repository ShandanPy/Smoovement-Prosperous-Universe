import { z } from 'zod';

const envSchema = z.object({
  FIO_BASE_URL: z.string().url().default('https://rest.fnar.net'),
});

/**
 * Parses and validates environment variables
 * Throws with descriptive Zod error if validation fails
 */
function parseEnv() {
  try {
    return envSchema.parse({
      FIO_BASE_URL: process.env.FIO_BASE_URL || 'https://rest.fnar.net',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map((issue) => {
          return `${issue.path.join('.')}: ${issue.message}`;
        })
        .join('\n');

      throw new Error(`Environment validation failed:\n${issues}`);
    }
    throw error;
  }
}

/**
 * Typed environment object
 * Validates environment variables on first access
 */
export const env = parseEnv();

export type Env = z.infer<typeof envSchema>;
