'use client'

import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ErrorBoundary } from 'react-error-boundary'

// HIGH RISK FORM: MemberInvite
// ML-Guided Generation: Enhanced validation for bug prevention
// Generated: 2025-12-12T15:39:27.423256
// Risk Score: 3 | Confidence: 75%
// Enum type definitions
export type RoleType = "owner" | "admin" | "member" | "viewer"

// Zod schema (prevent type mismatches and runtime errors)
const MemberInviteSchema = z.object({
  email: z.string().email('Invalid email format').min(1, 'Email Address is required'),
  role: z.enum(["owner", "admin", "member", "viewer"]),
  message: z.string().optional(),
})

type MemberInviteFormData = z.infer<typeof MemberInviteSchema>

interface MemberInviteFormProps {
  initialData?: Partial<MemberInviteFormData>
  onSubmit: (data: MemberInviteFormData) => Promise<void>
  mode?: 'create' | 'edit'
}

function FormError({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="rounded-md bg-red-50 p-4 border border-red-200" role="alert">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">Form Error</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>An unexpected error occurred: {error.message}</p>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={resetErrorBoundary}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function MemberInviteForm({ initialData, onSubmit, mode = 'create' }: MemberInviteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<MemberInviteFormData>({
    resolver: zodResolver(MemberInviteSchema),
    defaultValues: initialData,
  })

  const onSubmitWithRetry = async (data: MemberInviteFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await onSubmit(data)
      // Success - reset form if in create mode
      if (mode === 'create') {
        reset()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setSubmitError(errorMessage)

      // Retry logic for transient errors (max 2 retries)
      if (retryCount < 2 && errorMessage.includes('network')) {
        setRetryCount(prev => prev + 1)
        setTimeout(() => onSubmitWithRetry(data), 1000 * (retryCount + 1))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ErrorBoundary FallbackComponent={FormError} onReset={() => reset()}>
      <form onSubmit={handleSubmit(onSubmitWithRetry)} className="space-y-6" noValidate>
        {submitError && (
          <div className="rounded-md bg-red-50 p-4 border border-red-200" role="alert">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Submission Error</h3>
                <p className="mt-1 text-sm text-red-700">{submitError}</p>
              </div>
            </div>
          </div>
        )}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="mt-1">
            <input
              id="email"
              type="email"
              {...register('email')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              aria-describedby="email-error"
              aria-invalid={errors.email ? 'true' : 'false'}
            />
          </div>
          {errors.email && (
            <p className="mt-2 text-sm text-red-600" id="email-error" role="alert">
              {String(errors.email?.message || '')}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="role"
            className="block text-sm font-medium text-gray-700"
          >
            Role <span className="text-red-500">*</span>
          </label>
          <div className="mt-1">
            {/* Enum dropdown (prevents ENUM_FIELD_TEXT_INPUT bug) */}
            <select
              id="role"
              {...register('role')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              aria-describedby="role-error"
              aria-invalid={errors.role ? 'true' : 'false'}
            >
              <option value="">Select Role</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          {errors.role && (
            <p className="mt-2 text-sm text-red-600" id="role-error" role="alert">
              {String(errors.role?.message || '')}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="message"
            className="block text-sm font-medium text-gray-700"
          >
            Personal Message
          </label>
          <div className="mt-1">
            <input
              id="message"
              type="text"
              {...register('message')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              aria-describedby="message-error"
              aria-invalid={errors.message ? 'true' : 'false'}
            />
          </div>
          {errors.message && (
            <p className="mt-2 text-sm text-red-600" id="message-error" role="alert">
              {String(errors.message?.message || '')}
            </p>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            disabled={isSubmitting}
          >
            Reset
          </button>
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </>
            ) : (
              mode === 'create' ? 'Create' : 'Update'
            )}
          </button>
        </div>
      </form>
    </ErrorBoundary>
  )
}