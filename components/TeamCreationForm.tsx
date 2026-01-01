'use client'

import { useState, FormEvent } from 'react'

// MEDIUM RISK FORM: TeamCreation
// ML-Guided Generation: Standard validation (HTML5)
// Generated: 2025-12-12T15:39:27.044541
// Risk Score: 1 | Confidence: 65%

interface TeamCreationFormData {
  name: string
  description?: string
}

interface TeamCreationFormProps {
  initialData?: Partial<TeamCreationFormData>
  onSubmit: (data: TeamCreationFormData) => Promise<void>
  mode?: 'create' | 'edit'
}

export function TeamCreationForm({ initialData, onSubmit, mode = 'create' }: TeamCreationFormProps) {
  const [formData, setFormData] = useState<Partial<TeamCreationFormData>>(initialData || {})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
              type === 'number' ? parseFloat(value) || value :
              value
    }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await onSubmit(formData as TeamCreationFormData)

      // Reset form if in create mode
      if (mode === 'create') {
        setFormData({})
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          Team Name <span className="text-red-500">*</span>
        </label>
        <div className="mt-1">
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name || ''}
            onChange={handleChange}
            required
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <div className="mt-1">
          <input
            id="description"
            name="description"
            type="text"
            value={formData.description || ''}
            onChange={handleChange}
            
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => setFormData(initialData || {})}
          className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          disabled={isLoading}
        >
          Reset
        </button>
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? (mode === 'create' ? 'Creating...' : 'Updating...') : (mode === 'create' ? 'Create' : 'Update')}
        </button>
      </div>
    </form>
  )
}