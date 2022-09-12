import { renderWithProviders } from '@opentrons/components'
import * as React from 'react'
import { i18n } from '../../../i18n'

import { mockDeckCalTipRack, mockTipLengthCalBlock } from '../../../redux/sessions/__fixtures__'
import * as Sessions from '../../../redux/sessions'
import { SaveZPoint } from '../SaveZPoint'

describe('SaveZPoint', () => {
  let render: (
    props?: Partial<React.ComponentProps<typeof SaveZPoint>>
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
        currentStep = Sessions.DECK_STEP_JOGGING_TO_DECK,
        sessionType = Sessions.SESSION_TYPE_DECK_CALIBRATION,
        calBlock
      } = props
      return renderWithProviders(
        <SaveZPoint
          isMulti={isMulti}
          mount={mount}
          tipRack={tipRack}
          sendCommands={sendCommands}
          cleanUpAndExit={cleanUpAndExit}
          currentStep={currentStep}
          sessionType={sessionType}
          calBlock={calBlock}
        />,
        { i18nInstance: i18n }
      )
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('displays proper asset for left multi', () => {
    const { getByLabelText } = render({ mount: 'left', isMulti: true })[0]
    getByLabelText('left multi channel pipette moving to slot 5')
  })
  it('displays proper asset for right multi', () => {
    const { getByLabelText } = render({ mount: 'right', isMulti: true })[0]
    getByLabelText('right multi channel pipette moving to slot 5')
  })
  it('displays proper asset for left single', () => {
    const { getByLabelText } = render({ mount: 'left', isMulti: false })[0]
    getByLabelText('left single channel pipette moving to slot 5')
  })
  it('displays proper asset for right single', () => {
    const { getByLabelText } = render({ mount: 'right', isMulti: false })[0]
    getByLabelText('right single channel pipette moving to slot 5')
  })

  it('jogging sends command', () => {
    const { getByRole } = render()[0]
    getByRole('button', { name: 'up' }).click()

    expect(mockSendCommands).toHaveBeenCalledWith({
      command: Sessions.sharedCalCommands.JOG,
      data: { vector: [0, 0, 0.1] },
    })
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

  it('clicking proceed sends save offset and move to point one commands for deck cal', () => {
    const { getByRole } = render({
      sessionType: Sessions.SESSION_TYPE_DECK_CALIBRATION,
    })[0]
    getByRole('button', { name: 'Confirm placement' }).click()
    expect(mockSendCommands).toHaveBeenCalledWith(
      {
        command: Sessions.sharedCalCommands.SAVE_OFFSET,
      },
      {
        command: Sessions.sharedCalCommands.MOVE_TO_POINT_ONE,
      }
    )
  })

  it('clicking proceed sends save offset and move to point one commands for pipette offset cal', () => {
    const { getByRole } = render({
      sessionType: Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION,
    })[0]
    getByRole('button', { name: 'Confirm placement' }).click()
    expect(mockSendCommands).toHaveBeenCalledWith(
      {
        command: Sessions.sharedCalCommands.SAVE_OFFSET,
      },
      {
        command: Sessions.sharedCalCommands.MOVE_TO_POINT_ONE,
      }
    )
  })

  it('clicking proceed sends compare point and move to point one commands for health check', () => {
    const { getByRole } = render({
      sessionType: Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK,
    })[0]
    getByRole('button', { name: 'Confirm placement' }).click()
    expect(mockSendCommands).toHaveBeenCalledWith(
      {
        command: Sessions.checkCommands.COMPARE_POINT,
      },
      {
        command: Sessions.sharedCalCommands.MOVE_TO_POINT_ONE,
      }
    )
  })

  it('pip offset cal session type shows correct text', () => {
    const { getByText, getByRole } = render({
      sessionType: Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION,
    })[0]

    getByRole('heading', { name: 'Calibrate z-axis in slot 5' })
    getByText(
      'Jog the pipette until the tip is barely touching (less than 0.1 mm) the deck in slot 5.'
    )
    getByText(
      'If the pipette is over the embossed 5, on the ridge of the slot, or hard to see, switch to the x- and y-axis controls to move the pipette across the deck.'
    )
  })

  it('deck cal session type shows correct text', () => {
    const { getByText, getByRole } = render({
      sessionType: Sessions.SESSION_TYPE_DECK_CALIBRATION,
    })[0]

    getByRole('heading', { name: 'Calibrate z-axis in slot 5' })
    getByText(
      'Jog the pipette until the tip is barely touching (less than 0.1 mm) the deck in slot 5.'
    )
    getByText(
      'If the pipette is over the embossed 5, on the ridge of the slot, or hard to see, switch to the x- and y-axis controls to move the pipette across the deck.'
    )
  })

  it('health check session type shows correct text with block', () => {
    const { getByText, getByRole } = render({
      sessionType: Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK,
      calBlock: mockTipLengthCalBlock
    })[0]
    getByRole('heading', { name: 'Check z-axis on block' })
    getByText(
      'Jog the pipette until the tip is barely touching (less than 0.1 mm) the block in slot 6.'
    )
  })

  it('health check session type shows correct text without block', () => {
    const { getByText, getByRole } = render({
      sessionType: Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK,
    })[0]
    getByRole('heading', { name: 'Check z-axis on trash bin' })
    getByText(
      'Jog the pipette until the tip is barely touching (less than 0.1 mm) the flat surface of the trash bin.'
    )
  })
})
