import { z } from 'zod';

// Define the environment schema
const envSchema = z.object({
  FIO_BASE_URL: z.string().url().default('https://rest.fnar.net'),
});

// Parse and validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse({
      FIO_BASE_URL: process.env.FIO_BASE_URL,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map((issue) => {
          return `${issue.path.join('.')}: ${issue.message}`;
        })
        .join('\n');

      throw new Error(
        `Invalid environment variables:\n${issues}\n\n` +
          'Please check your .env.local file or Vercel environment settings.'
      );
    }
    throw error;
  }
};

// Export typed environment object
export const env = parseEnv();

// Export type for the environment
export type Env = z.infer<typeof envSchema>;
