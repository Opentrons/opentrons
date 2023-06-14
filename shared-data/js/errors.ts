import errorDefinitions from '../errors/definitions/1/errors.json'

export type ErrorCodes = keyof typeof errorDefinitions.codes
export type ErrorCategories = keyof typeof errorDefinitions.categories

export interface ErrorCategory {
  detail: string
  codePrefix: string
}

export interface ErrorBody {
  detail: string
  category: ErrorCategory
  code: ErrorCodes
}

interface JSONErrorBody {
  detail: string
  category: ErrorCategories
}

export function getError(code: ErrorCodes): ErrorBody | null {
  return errorDefinitions.codes[code]
    ? {
        code: code,
        detail: errorDefinitions.codes[code].detail,
        category:
          errorDefinitions.categories[
            (errorDefinitions.codes[code] as JSONErrorBody).category
          ],
      }
    : null
}
