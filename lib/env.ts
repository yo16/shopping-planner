import { z } from 'zod';

const envSchema = z.object({
  APP_PASSWORD: z.string().min(1, 'APP_PASSWORD is required'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type EnvConfig = z.infer<typeof envSchema>;

let envConfig: EnvConfig;

try {
  envConfig = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Environment variable validation failed:');
    error.issues.forEach((err) => {
      console.error(`- ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
  throw error;
}

export { envConfig };