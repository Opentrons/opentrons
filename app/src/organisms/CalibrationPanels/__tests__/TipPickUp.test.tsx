import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { mockDeckCalTipRack } from '../../../redux/sessions/__fixtures__'
import * as Sessions from '../../../redux/sessions'

import { TipPickUp } from '../TipPickUp'

describe('TipPickUp', () => {
  let render: (
    props?: Partial<React.ComponentProps<typeof TipPickUp>>
  ) => ReturnType<typeof renderWithProviders>

  const mockSendCommands = jest.fn()
  const mockDeleteSession = jest.fn()

  beforeEach(() => {
    render = (props = {}) => {
      const {
        mount = 'left',
        isMulti = false,
        tipRack = mockDeckCalTipRack,
        sendCommands = mockSendCommands,
        cleanUpAndExit = mockDeleteSession,
        currentStep = Sessions.DECK_STEP_PREPARING_PIPETTE,
        sessionType = Sessions.SESSION_TYPE_DECK_CALIBRATION,
      } = props
      return renderWithProviders(
        <TipPickUp
          isMulti={isMulti}
          mount={mount}
          tipRack={tipRack}
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

  it('jogging sends command', () => {
    const { getByRole } = render()[0]
    getByRole('button', { name: 'forward' }).click()

    expect(mockSendCommands).toHaveBeenCalledWith({
      command: Sessions.sharedCalCommands.JOG,
      data: { vector: [0, -0.1, 0] },
    })
  })

  it('clicking pick up tip sends pick up tip command', () => {
    const { getByRole } = render()[0]
    getByRole('button', { name: 'Pick up tip' }).click()
    expect(mockSendCommands).toHaveBeenCalledWith({
      command: Sessions.sharedCalCommands.PICK_UP_TIP,
    })
  })

  it('renders the need help link', () => {
    const { getByRole } = render()[0]
    getByRole('link', { name: 'Need help?' })
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
})
