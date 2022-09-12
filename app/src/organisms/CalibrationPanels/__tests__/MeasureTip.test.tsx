import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import {
  mockTipLengthCalBlock,
  mockTipLengthTipRack,
} from '../../../redux/sessions/__fixtures__'
import * as Sessions from '../../../redux/sessions'

import { MeasureTip } from '../MeasureTip'

describe('MeasureTip', () => {
  let render: (
    props?: Partial<React.ComponentProps<typeof MeasureTip>>
  ) => ReturnType<typeof renderWithProviders>

  const mockSendCommands = jest.fn()
  const mockDeleteSession = jest.fn()

  beforeEach(() => {
    render = (props = {}) => {
      const {
        mount = 'left',
        isMulti = false,
        tipRack = mockTipLengthTipRack,
        calBlock = mockTipLengthCalBlock,
        sendCommands = mockSendCommands,
        cleanUpAndExit = mockDeleteSession,
        currentStep = Sessions.TIP_LENGTH_STEP_MEASURING_NOZZLE_OFFSET,
        sessionType = Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION,
      } = props
      return renderWithProviders(
        <MeasureTip
          isMulti={isMulti}
          mount={mount}
          tipRack={tipRack}
          calBlock={calBlock}
          sendCommands={sendCommands}
          cleanUpAndExit={cleanUpAndExit}
          currentStep={currentStep}
          sessionType={sessionType}
        />,
        { i18nInstance: i18n }
      )
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders the confirm crash modal when invoked', () => {
    const { getByText, queryByText } = render()[0]
    expect(
      queryByText(
        "Starting over will cancel your calibration progress. It's important to use an undamaged tip while you calibrate your robot."
      )
    ).toBeNull()
    const crashLink = getByText('Start over')
    crashLink.click()
    getByText(
      "Starting over will cancel your calibration progress. It's important to use an undamaged tip while you calibrate your robot."
    )
  })

  it('renders the need help link', () => {
    const { getByRole } = render()[0]
    getByRole('link', { name: 'Need help?' })
  })

  it('jogging sends command', () => {
    const { getByRole } = render()[0]
    getByRole('button', { name: 'forward' }).click()

    expect(mockSendCommands).toHaveBeenCalledWith({
      command: Sessions.sharedCalCommands.JOG,
      data: { vector: [0, -0.1, 0] },
    })
  })

  it('clicking proceed sends save offset and move to tip rack commands for tip length cal', () => {
    const { getByRole } = render({
      sessionType: Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION,
    })[0]
    getByRole('button', { name: 'Confirm placement' }).click()
    expect(mockSendCommands).toHaveBeenCalledWith(
      {
        command: Sessions.sharedCalCommands.SAVE_OFFSET,
      },
      {
        command: Sessions.sharedCalCommands.MOVE_TO_TIP_RACK,
      }
    )
  })

  it('clicking proceed sends only move to tip rack commands for cal health check', () => {
    const { getByRole } = render({
      sessionType: Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK,
    })[0]
    getByRole('button', { name: 'Confirm placement' }).click()
    expect(mockSendCommands).toHaveBeenCalledWith(
      {
        command: Sessions.checkCommands.COMPARE_POINT,
      },
      {
        command: Sessions.sharedCalCommands.MOVE_TO_DECK,
      }
    )
  })
})
