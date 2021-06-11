import * as React from 'react'
import { format } from 'date-fns'

import { mountWithStore } from '@opentrons/components/__utils__'
import { RunTimer } from '../RunTimer'
import * as selectors from '../../../../redux/robot/selectors'

jest.mock('../../../../redux/robot/selectors')

const getIsPausedMock = selectors.getIsPaused as jest.MockedFunction<
  typeof selectors.getIsPaused
>
const getPausedSecondsMock = selectors.getPausedSeconds as jest.MockedFunction<
  typeof selectors.getPausedSeconds
>
const getRunSecondsMock = selectors.getRunSeconds as jest.MockedFunction<
  typeof selectors.getRunSeconds
>
const getStartTimeMsMock = selectors.getStartTimeMs as jest.MockedFunction<
  typeof selectors.getStartTimeMs
>
// todo: mock `useInterval`?

describe('RunTimer component', () => {
  interface Environment {
    isPaused: boolean
    pausedSeconds: number
    runSeconds: number
    startTime: number | null
  }

  function mockEnvironment({
    isPaused = false,
    pausedSeconds = 0,
    runSeconds = 0,
    startTime = new Date('2020-01-01').getTime(),
  }: Partial<Environment> = {}): Environment {
    getIsPausedMock.mockReturnValue(isPaused)
    getPausedSecondsMock.mockReturnValue(pausedSeconds)
    getRunSecondsMock.mockReturnValue(runSeconds)
    getStartTimeMsMock.mockReturnValue(startTime)
    return { isPaused, pausedSeconds, runSeconds, startTime }
  }

  const render = () => mountWithStore(<RunTimer />)

  it('displays the start time if not null', () => {
    const { startTime } = mockEnvironment()
    const { wrapper } = render()
    const expected = format(startTime!, 'pp')
    expect(wrapper.html()).toContain(`Start Time: ${expected}`)
  })

  it('renders start time as empty if null', () => {
    mockEnvironment({ startTime: null })
    const { wrapper } = render()
    expect(wrapper.html()).toContain('Start Time: <')
  })

  it(`should headline the run time when not paused`, () => {
    mockEnvironment({ isPaused: false, runSeconds: 10 })
    const { wrapper } = render()
    expect(wrapper.html()).toContain('<p>Total Runtime: </p>00:00:10')
  })

  it(`should present a less distinguished run time when paused`, () => {
    mockEnvironment({ isPaused: true, runSeconds: 10 })
    const { wrapper } = render()
    expect(wrapper.html()).toContain('Total Runtime: 00:00:10')
  })

  it('does not render paused time if not paused', () => {
    mockEnvironment({ isPaused: false })
    const { wrapper } = render()
    expect(wrapper.html()).not.toContain(`Paused For`)
  })

  it('does render paused time if paused', () => {
    mockEnvironment({ isPaused: true, pausedSeconds: 10 })
    const { wrapper } = render()
    expect(wrapper.html()).toContain(`Paused For`)
    expect(wrapper.html()).toContain(`00:00:10`)
  })
})
