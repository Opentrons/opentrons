// error of type exists somewhere in timeline errors
export function expectTimelineError(errors, errorType) {
  expect(errors).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: errorType,
      }),
    ])
  )
}
