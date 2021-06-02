import * as Types from './types'

// TODO(mc, 2020-06-17): this is unit tested by component tests
// write some direct tests and maybe fold into getRequestState selector
export const getErrorResponseMessage = (
  response: { message?: string } | Types.RobotApiV2ErrorResponseBody
): string | undefined => {
  // @ts-expect-error TODO: use in operator to narrow allow for type narrowing
  if (response.message) {
    // @ts-expect-error TODO: use in operator to narrow allow for type narrowing
    return response.message
  }

  // @ts-expect-error TODO: use in operator to narrow allow for type narrowing
  if (response.errors) {
    // @ts-expect-error TODO: use in operator to narrow allow for type narrowing
    return response.errors.flatMap(e => (e.detail ? [e.detail] : [])).join(',')
  }

  return ''
}
