import { CommandCreatorError } from '../types'

// error of type exists somewhere in timeline errors
export function expectTimelineError(
  errors: CommandCreatorError[],
  errorType: string
): void {
  expect(errors).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: errorType,
      }),
    ])
  )
}
