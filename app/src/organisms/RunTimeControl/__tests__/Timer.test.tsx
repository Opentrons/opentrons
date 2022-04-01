import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { Timer } from '../Timer'
import { useCurrentRunTimestamps } from '../hooks'
import {
  RUN_STATUS_RUNNING,
  RUN_STATUS_STOP_REQUESTED,
} from '@opentrons/api-client'

jest.mock('../hooks')

const START_TIME = '2021-10-07T18:44:49.366581+00:00'
const PAUSED_TIME = '2021-10-07T18:47:55.366581+00:00'
const COMPLETED_TIME = '2021-10-07T18:58:59.366581+00:00'
const STOPPED_TIME = '2021-10-07T18:45:49.366581+00:00'

const mockUseCurrentRunTimestamps = useCurrentRunTimestamps as jest.MockedFunction<
  typeof useCurrentRunTimestamps
>

describe('Timer', () => {
  let render: (
    props?: React.ComponentProps<typeof Timer>
  ) => ReturnType<typeof renderWithProviders>

  beforeEach(() => {
    mockUseCurrentRunTimestamps.mockReturnValue({
      startedAt: null,
      pausedAt: null,
      stoppedAt: null,
      completedAt: null,
    })
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
    mockUseCurrentRunTimestamps.mockReturnValue({
      startedAt: null,
      pausedAt: PAUSED_TIME,
      stoppedAt: null,
      completedAt: null,
    })
    const [{ getAllByText, getByText }] = render()

    expect(getByText('Run Time:')).toBeTruthy()
    expect(getByText('Paused For:')).toBeTruthy()
    expect(getAllByText(/^(\d{2,}):(\d{2}):(\d{2})$/).length).toEqual(2)
  })

  it('renders a completed time when completed', async () => {
    mockUseCurrentRunTimestamps.mockReturnValue({
      startedAt: null,
      pausedAt: null,
      stoppedAt: null,
      completedAt: COMPLETED_TIME,
    })
    const [{ getByText }] = render()

    expect(getByText('Run Time:')).toBeTruthy()
    expect(getByText('00:14:10')).toBeTruthy()
  })

  it('renders a stopped time when run is canceled', () => {
    mockUseCurrentRunTimestamps.mockReturnValue({
      startedAt: null,
      pausedAt: null,
      stoppedAt: STOPPED_TIME,
      completedAt: null,
    })
    const [{ getByText }] = render({
      startTime: START_TIME,
      runStatus: RUN_STATUS_STOP_REQUESTED,
    })

    expect(getByText('Run Time:')).toBeTruthy()
    expect(getByText('00:01:00')).toBeTruthy()
  })
})
