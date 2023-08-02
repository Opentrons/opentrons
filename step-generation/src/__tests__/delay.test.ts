import { delay } from '../commandCreators/atomic/delay'
import { PauseArgs } from '../types'
import { getSuccessResult } from '../fixtures'

const getRobotInitialState = (): any => {
  // This particular state shouldn't matter for delay
  return {}
}

// neither should InvariantContext
const invariantContext: any = {}
let mixInArgs: PauseArgs
beforeEach(() => {
  mixInArgs = {
    commandCreatorFnName: 'delay',
    meta: null,
    name: 'Delay Test',
    description: 'test blah blah',
    wait: true,
  }
})
describe('delay', () => {
  it('should delay until the user clicks resume', () => {
    const robotInitialState = getRobotInitialState()
    const message = 'delay indefinitely message'
    const result = delay(
      { ...mixInArgs, message, wait: true },
      invariantContext,
      robotInitialState
    )
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      {
        commandType: 'waitForResume',
        key: expect.any(String),
        params: {
          message,
        },
      },
    ])
  })

  it('should delay for a given duration', () => {
    const robotInitialState = getRobotInitialState()
    const message = 'delay 95.5 secs message'
    const result = delay(
      { ...mixInArgs, message, wait: 95.5 },
      invariantContext,
      robotInitialState
    )
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      {
        commandType: 'waitForDuration',
        key: expect.any(String),
        params: {
          seconds: 95.5,
          message,
        },
      },
    ])
  })
})
