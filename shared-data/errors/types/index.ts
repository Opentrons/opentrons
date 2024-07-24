// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import ERROR_DATA from '../definitions/1/errors.json'

export type ErrorCategories = keyof typeof ERROR_DATA['categories']
export interface CategorySpec {
  detail: string
  codePrefix: string
}
export type ErrorCodes = keyof typeof ERROR_DATA['codes']
export interface ErrorSpec {
  detail: string
  category: ErrorCategories
}
export type ErrorSpecs = Record<ErrorCodes, ErrorSpec>
export type CategorySpecs = Record<ErrorCategories, CategorySpec>
