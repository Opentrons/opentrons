import * as Types from './types'

// TODO(mc, 2020-06-17): this is unit tested by component tests
// write some direct tests and maybe fold into getRequestState selector
export const getErrorResponseMessage = (
  response: { message: string } | Types.RobotApiV2ErrorResponseBody
): string => {
  if ('message' in response) {
    return response.message
  }

  if ('errors' in response) {
    return response.errors.flatMap(e => (e.detail ? [e.detail] : [])).join(',')
  }

  return ''
}
