/**
 * Environment Variable Validation
 *
 * Validates required environment variables at build/runtime.
 * Throws clear errors if variables are missing, preventing deployment issues.
 */

/**
 * Required environment variables for the application
 */
const requiredEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
} as const

/**
 * Validate all required environment variables
 *
 * Throws error with helpful message if any are missing
 */
function validateEnv() {
  const missing: string[] = []

  Object.entries(requiredEnvVars).forEach(([name, value]) => {
    if (!value) {
      missing.push(name)
    }
  })

  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variable${missing.length > 1 ? 's' : ''}:\n\n` +
      missing.map(name => `  - ${name}`).join('\n') +
      `\n\nPlease add ${missing.length > 1 ? 'them' : 'it'} to your .env.local file.\n` +
      `See .env.example for reference.\n\n` +
      `Required variables:\n` +
      `  - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL\n` +
      `  - NEXT_PUBLIC_SUPABASE_ANON_KEY: Supabase anonymous/public key\n` +
      `  - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key (server-side only)\n`
    )
  }
}

// Validate immediately when this module is imported
validateEnv()

/**
 * Typed and validated environment variables
 *
 * Use these instead of process.env to ensure variables exist
 */
export const env = {
  NEXT_PUBLIC_SUPABASE_URL: requiredEnvVars.NEXT_PUBLIC_SUPABASE_URL!,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requiredEnvVars.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  SUPABASE_SERVICE_ROLE_KEY: requiredEnvVars.SUPABASE_SERVICE_ROLE_KEY!,
} as const

/**
 * Optional environment variables with defaults
 */
export const optionalEnv = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  VERCEL_ENV: process.env.VERCEL_ENV,
  VERCEL_URL: process.env.VERCEL_URL,
} as const

/**
 * Check if running in production
 */
export const isProduction = optionalEnv.NODE_ENV === 'production'

/**
 * Check if running in development
 */
export const isDevelopment = optionalEnv.NODE_ENV === 'development'

/**
 * Check if running on Vercel
 */
export const isVercel = Boolean(optionalEnv.VERCEL_ENV)
