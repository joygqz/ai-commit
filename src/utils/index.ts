import type { Progress } from 'vscode'
import { ProgressLocation, window, workspace } from 'vscode'
import { name } from './constants'

export class ProgressHandler {
  static async withProgress<T>(
    title: string,
    task: (progress: Progress<{ message?: string, increment?: number }>) => Promise<T>,
  ): Promise<T> {
    return window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: `${title}`,
        cancellable: false,
      },
      progress => task(progress),
    )
  }
}

export interface ValidationRule {
  key: string
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => boolean
  errorMessage: string
}

export interface ValidationResult {
  isValid: boolean
  error?: string
  errors?: string[]
}

export function validateConfig(rules: ValidationRule[]): ValidationResult {
  const errors: string[] = []

  for (const rule of rules) {
    const value = workspace.getConfiguration(name).get(rule.key)

    // Required check
    if (rule.required) {
      if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
        errors.push(rule.errorMessage)
        continue
      }
    }

    // Skip other validations if value is empty and not required
    if (value === undefined || value === null || value === '') {
      continue
    }

    const strValue = String(value)

    // Min length check
    if (rule.minLength !== undefined && strValue.length < rule.minLength) {
      errors.push(rule.errorMessage)
      continue
    }

    // Max length check
    if (rule.maxLength !== undefined && strValue.length > rule.maxLength) {
      errors.push(rule.errorMessage)
      continue
    }

    // Pattern check
    if (rule.pattern && !rule.pattern.test(strValue)) {
      errors.push(rule.errorMessage)
      continue
    }

    // Custom validation
    if (rule.custom && !rule.custom(value)) {
      errors.push(rule.errorMessage)
      continue
    }
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      error: errors[0],
      errors,
    }
  }

  return { isValid: true }
}
