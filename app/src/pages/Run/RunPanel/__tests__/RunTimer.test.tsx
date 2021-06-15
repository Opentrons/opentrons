import * as React from 'react'
import { when } from 'jest-when'

import { RunTimer } from '../RunTimer'
import { formatSeconds, formatTime } from '../utils'
import { mountWithStore } from '@opentrons/components/__utils__'
import * as selectors from '../../../../redux/robot/selectors'
import { State } from '../../../../redux/types'

jest.mock('../utils')
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
const formatSecondsMock = formatSeconds as jest.MockedFunction<
  typeof formatSeconds
>
const formatTimeMock = formatTime as jest.MockedFunction<typeof formatTime>

describe('RunTimer component', () => {
  interface Environment {
    isPaused: boolean
    pausedSeconds: number
    runSeconds: number
    startTime: number | null
  }

  const MOCKED_STATE: State = ({ mockState: true } as unknown) as State

  function mockEnvironment({
    isPaused = false,
    pausedSeconds = 0,
    runSeconds = 0,
    startTime = new Date('2020-01-01').getTime(),
  }: Partial<Environment> = {}): Environment {
    when(getIsPausedMock).calledWith(MOCKED_STATE).mockReturnValue(isPaused)
    when(getStartTimeMsMock).calledWith(MOCKED_STATE).mockReturnValue(startTime)
    getPausedSecondsMock.mockReturnValue(pausedSeconds)
    getRunSecondsMock.mockReturnValue(runSeconds)
    return { isPaused, pausedSeconds, runSeconds, startTime }
  }

  const render = () =>
    mountWithStore(<RunTimer />, { initialState: MOCKED_STATE })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('properly render the start time', () => {
    const { startTime } = mockEnvironment()
    formatTimeMock.mockReturnValue('7:00 PM')
    const { wrapper } = render()
    expect(wrapper.html()).toContain(`Start Time: 7:00 PM`)
    expect(formatTimeMock).toBeCalledWith(startTime)
  })

  it(`should headline the run time when not paused`, () => {
    const { runSeconds } = mockEnvironment({ isPaused: false, runSeconds: 10 })
    formatSecondsMock.mockReturnValue('00:00:10')
    const { wrapper } = render()
    expect(wrapper.html()).toContain('<p>Total Runtime: </p>00:00:10')
    expect(formatSecondsMock).toBeCalledWith(runSeconds)
  })

  it(`should present a less distinguished run time when paused`, () => {
    mockEnvironment({ isPaused: true, runSeconds: 10 })
    formatSecondsMock.mockReturnValue('00:00:10')
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
    formatSecondsMock.mockReturnValue('00:00:10')
    const { wrapper } = render()
    expect(wrapper.html()).toContain(`Paused For`)
    expect(wrapper.html()).toContain(`00:00:10`)
  })
})
