import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'
import { RUN_STATUS_RUNNING, RUN_STATUS_IDLE } from '@opentrons/api-client'

import { i18n } from '../../../../i18n'
import { mockRobotSideAnalysis } from '../../../CommandText/__fixtures__'
import { RunningProtocolCommandList } from '../RunningProtocolCommandList'

const mockPlayRun = jest.fn()
const mockPauseRun = jest.fn()
const mockStopRun = jest.fn()

const render = (
  props: React.ComponentProps<typeof RunningProtocolCommandList>
) => {
  return renderWithProviders(<RunningProtocolCommandList {...props} />, {
    i18nInstance: i18n,
  })
}

describe('RunningProtocolCommandList', () => {
  let props: React.ComponentProps<typeof RunningProtocolCommandList>
  beforeEach(() => {
    props = {
      runStatus: RUN_STATUS_RUNNING,
      robotSideAnalysis: mockRobotSideAnalysis,
      playRun: mockPlayRun,
      pauseRun: mockPauseRun,
      stopRun: mockStopRun,
      trackProtocolRunEvent: jest.fn(), // temporary
      protocolName: 'mockRunningProtocolName',
      currentRunCommandIndex: 0,
    }
  })
  it('should render text and buttons', () => {
    const [{ getByText, getByLabelText }] = render(props)
    getByText('Running')
    getByText('mockRunningProtocolName')
    getByText('Load P300 Single-Channel GEN1 in Left Mount')
    getByLabelText('stop')
    getByLabelText('pause')
  })

  it('should render play button when runStatus is idle', () => {
    props = {
      ...props,
      runStatus: RUN_STATUS_IDLE,
    }
    const [{ getByLabelText }] = render(props)
    getByLabelText('play')
  })
})
