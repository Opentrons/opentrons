import * as React from 'react'
import { fireEvent } from '@testing-library/react'

import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'
import { renderWithProviders } from '@opentrons/components'
import { RUN_STATUS_RUNNING, RUN_STATUS_IDLE } from '@opentrons/api-client'

import { i18n } from '../../../../i18n'
import { mockRobotSideAnalysis } from '../../../CommandText/__fixtures__'
import { RunningProtocolCommandList } from '../RunningProtocolCommandList'

const mockPlayRun = jest.fn()
const mockPauseRun = jest.fn()
const mockShowModal = jest.fn()

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
      setShowConfirmCancelRunModal: mockShowModal,
      trackProtocolRunEvent: jest.fn(), // temporary
      robotAnalyticsData: {} as any,
      protocolName: 'mockRunningProtocolName',
      currentRunCommandIndex: 0,
      robotType: FLEX_ROBOT_TYPE
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

  it('when tapping stop button, the modal is showing up', () => {
    const [{ getByLabelText }] = render(props)
    const button = getByLabelText('stop')
    fireEvent.click(button)
    expect(mockShowModal).toHaveBeenCalled()
  })

  // ToDo (kj:04/10/2023) once we fix the track event stuff, we can implement tests
  it.todo('when tapping play button, track event mock function is called')
})
