import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { Timer } from '../Timer'
import { useRunCompleteTime, useRunPauseTime, useRunStopTime } from '../hooks'
import {
  RUN_STATUS_RUNNING,
  RUN_STATUS_STOP_REQUESTED,
} from '@opentrons/api-client'

jest.mock('../hooks')

const START_TIME = '2021-10-07T18:44:49.366581+00:00'
const PAUSED_TIME = '2021-10-07T18:47:55.366581+00:00'
const COMPLETED_TIME = '2021-10-07T18:58:59.366581+00:00'
const STOPPED_TIME = '2021-10-07T18:45:49.366581+00:00'

const mockUseRunCompleteTime = useRunCompleteTime as jest.MockedFunction<
  typeof useRunCompleteTime
>
const mockUseRunStopTime = useRunStopTime as jest.MockedFunction<
  typeof useRunStopTime
>
const mockUseRunPauseTime = useRunPauseTime as jest.MockedFunction<
  typeof useRunPauseTime
>

describe('Timer', () => {
  let render: (
    props?: React.ComponentProps<typeof Timer>
  ) => ReturnType<typeof renderWithProviders>

  beforeEach(() => {
    mockUseRunCompleteTime.mockReturnValue(null)
    mockUseRunPauseTime.mockReturnValue(null)
    mockUseRunStopTime.mockReturnValue(null)
    render = (
      props = {
        startTime: START_TIME,
        runStatus: RUN_STATUS_RUNNING,
      }
    ) => {
      return renderWithProviders(<Timer {...props} />, {
        i18nInstance: i18n,
      })
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders a start time', () => {
    const [{ getByText }] = render()

    expect(
      getByText(
        /^Start Time: (\d{1,2}):(\d{2}):(\d{2}) (A|P)M GMT(\+|-)(\d{2}):(\d{2})$/
      )
    ).toBeTruthy()
  })

  it('renders a run time', () => {
    const [{ getByText }] = render()

    expect(getByText('Run Time:')).toBeTruthy()
    expect(getByText(/^(\d{2,}):(\d{2}):(\d{2})$/)).toBeTruthy()
  })

  it('renders a paused time and a run time when paused', () => {
    mockUseRunPauseTime.mockReturnValue(PAUSED_TIME)
    const [{ getAllByText, getByText }] = render()

    expect(getByText('Run Time:')).toBeTruthy()
    expect(getByText('Paused For:')).toBeTruthy()
    expect(getAllByText(/^(\d{2,}):(\d{2}):(\d{2})$/).length).toEqual(2)
  })

  it('renders a completed time when completed', async () => {
    mockUseRunCompleteTime.mockReturnValue(COMPLETED_TIME)
    const [{ getByText }] = render()

    expect(getByText('Run Time:')).toBeTruthy()
    expect(getByText('00:14:10')).toBeTruthy()
  })

  it('renders a stopped time when run is canceled', () => {
    mockUseRunStopTime.mockReturnValue(STOPPED_TIME)
    const [{ getByText }] = render({
      startTime: START_TIME,
      runStatus: RUN_STATUS_STOP_REQUESTED,
    })

    expect(getByText('Run Time:')).toBeTruthy()
    expect(getByText('00:01:00')).toBeTruthy()
  })
})
