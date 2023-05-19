export const fullCommandMessage =
  'This is a user generated message that gives details about the pause command. This text is truncated to 220 characters. semper risus in hendrerit gravida rutrum quisque non tellus orci ac auctor augue mauris augue neque gravida in fermentum et sollicitudin ac orci phasellus egestas tellus rutrum tellus pellentesque'

export const truncatedCommandMessage =
  'This is a user generated message that gives details about the pause command. This text is truncated to 220 characters. semper risus in hendrerit gravida rutrum quisque non tellus orci ac auctor augue mauris augue nequ...'

export const shortCommandText =
  "this won't get truncated because it isn't more than 220 characters."

export const mockPauseCommandWithStartTime = {
  commandType: 'waitForResume',
  startedAt: new Date(),
  params: {
    message: fullCommandMessage,
  },
} as any

export const mockPauseCommandWithoutStartTime = {
  commandType: 'waitForResume',
  startedAt: null,
  params: {
    message: fullCommandMessage,
  },
} as any

export const mockPauseCommandWithShortMessage = {
  commandType: 'waitForResume',
  startedAt: null,
  params: {
    message: shortCommandText,
  },
} as any

export const mockPauseCommandWithNoMessage = {
  commandType: 'waitForResume',
  startedAt: null,
  params: {
    message: null,
  },
} as any
