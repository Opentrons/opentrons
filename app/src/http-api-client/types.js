// @flow
// http api client types

import type {ClientResponseError} from './client'

export type ApiResponse<T> = {
  /** request in progress flag */
  inProgress: boolean,
  /** possible error response */
  error: ?ClientResponseError,
  /** possible success response */
  response?: T
}
