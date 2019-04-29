// @flow
import _delay from '../commandCreators/atomic/delay'
import { commandCreatorNoErrors } from './fixtures'

const delay = commandCreatorNoErrors(_delay)

const getRobotInitialState = (): any => {
  // This particular state shouldn't matter for delay
  return {}
}

// neither should InvariantContext
const invariantContext: any = {}

describe('delay indefinitely', () => {
  test('...', () => {
    const robotInitialState = getRobotInitialState()
    const message = 'delay indefinitely message'

    const result = delay({
      message,
      description: 'description',
      name: 'name',
      wait: true,
    })(invariantContext, robotInitialState)

    expect(result.robotState).toEqual(getRobotInitialState())
    expect(result.robotState).toBe(robotInitialState) // same object

    expect(result.commands).toEqual([
      {
        command: 'delay',
        params: {
          wait: true,
          message,
        },
      },
    ])
  })
})

describe('delay for a given time', () => {
  test('...', () => {
    const robotInitialState = getRobotInitialState()
    const message = 'delay 95.5 secs message'

    const result = delay({
      message,
      description: 'description',
      name: 'name',
      wait: 95.5,
    })(invariantContext, robotInitialState)

    expect(result.robotState).toEqual(getRobotInitialState())
    expect(result.robotState).toBe(robotInitialState) // same object

    expect(result.commands).toEqual([
      {
        command: 'delay',
        params: {
          wait: 95.5,
          message,
        },
      },
    ])
  })
})
