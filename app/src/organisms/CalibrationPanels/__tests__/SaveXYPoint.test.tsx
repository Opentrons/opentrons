import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'

import { mockDeckCalTipRack } from '../../../redux/sessions/__fixtures__'
import * as Sessions from '../../../redux/sessions'
import { SaveXYPoint } from '../SaveXYPoint'

describe('SaveXYPoint', () => {
  let render: (
    props?: Partial<React.ComponentProps<typeof SaveXYPoint>>
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
        currentStep = Sessions.DECK_STEP_SAVING_POINT_ONE,
        sessionType = Sessions.SESSION_TYPE_DECK_CALIBRATION,
      } = props
      return renderWithProviders(
        <SaveXYPoint
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

  it('displays proper assets for slot 1 left multi', () => {
    const { getByLabelText } = render({
      mount: 'left',
      isMulti: true,
      currentStep: Sessions.DECK_STEP_SAVING_POINT_ONE,
    })[0]
    getByLabelText('left multi channel pipette moving to slot 1')
  })
  it('displays proper asset for slot 1 right multi', () => {
    const { getByLabelText } = render({
      mount: 'right',
      isMulti: true,
      currentStep: Sessions.DECK_STEP_SAVING_POINT_ONE,
    })[0]
    getByLabelText('right multi channel pipette moving to slot 1')
  })
  it('displays proper asset for slot 1 left single', () => {
    const { getByLabelText } = render({
      mount: 'left',
      isMulti: false,
      currentStep: Sessions.DECK_STEP_SAVING_POINT_ONE,
    })[0]
    getByLabelText('left single channel pipette moving to slot 1')
  })
  it('displays proper asset for slot 1 right single', () => {
    const { getByLabelText } = render({
      mount: 'right',
      isMulti: false,
      currentStep: Sessions.DECK_STEP_SAVING_POINT_ONE,
    })[0]
    getByLabelText('right single channel pipette moving to slot 1')
  })

  it('displays proper asset for slot 3 left multi', () => {
    const { getByLabelText } = render({
      mount: 'left',
      isMulti: true,
      currentStep: Sessions.DECK_STEP_SAVING_POINT_TWO,
    })[0]
    getByLabelText('left multi channel pipette moving to slot 3')
  })
  it('displays proper asset for slot 3 right multi', () => {
    const { getByLabelText } = render({
      mount: 'right',
      isMulti: true,
      currentStep: Sessions.DECK_STEP_SAVING_POINT_TWO,
    })[0]
    getByLabelText('right multi channel pipette moving to slot 3')
  })
  it('displays proper asset for slot 3 left single', () => {
    const { getByLabelText } = render({
      mount: 'left',
      isMulti: false,
      currentStep: Sessions.DECK_STEP_SAVING_POINT_TWO,
    })[0]
    getByLabelText('left single channel pipette moving to slot 3')
  })
  it('displays proper asset for slot 3 right single', () => {
    const { getByLabelText } = render({
      mount: 'right',
      isMulti: false,
      currentStep: Sessions.DECK_STEP_SAVING_POINT_TWO,
    })[0]
    getByLabelText('right single channel pipette moving to slot 3')
  })

  it('displays proper asset for slot 7 left multi', () => {
    const { getByLabelText } = render({
      mount: 'left',
      isMulti: true,
      currentStep: Sessions.DECK_STEP_SAVING_POINT_THREE,
    })[0]
    getByLabelText('left multi channel pipette moving to slot 7')
  })
  it('displays proper asset for slot 7 right multi', () => {
    const { getByLabelText } = render({
      mount: 'right',
      isMulti: true,
      currentStep: Sessions.DECK_STEP_SAVING_POINT_THREE,
    })[0]
    getByLabelText('right multi channel pipette moving to slot 7')
  })
  it('displays proper asset for slot 7 left single', () => {
    const { getByLabelText } = render({
      mount: 'left',
      isMulti: false,
      currentStep: Sessions.DECK_STEP_SAVING_POINT_THREE,
    })[0]
    getByLabelText('left single channel pipette moving to slot 7')
  })
  it('displays proper asset for slot 7 right single', () => {
    const { getByLabelText } = render({
      mount: 'right',
      isMulti: false,
      currentStep: Sessions.DECK_STEP_SAVING_POINT_THREE,
    })[0]
    getByLabelText('right single channel pipette moving to slot 7')
  })

  it('jogging sends command', () => {
    const { getByRole } = render()[0]
    getByRole('button', { name: 'forward' }).click()

    expect(mockSendCommands).toHaveBeenCalledWith({
      command: Sessions.sharedCalCommands.JOG,
      data: { vector: [0, -0.1, 0] },
    })
  })

  it('renders the confirm crash modal when invoked', () => {
    const { getByText, queryByText } = render()[0]
    expect(
      queryByText('Starting over will cancel your calibration progress.')
    ).toBeNull()
    const crashLink = getByText('Start over')
    crashLink.click()
    getByText('Starting over will cancel your calibration progress.')
  })

  it('renders the need help link', () => {
    const { getByRole } = render()[0]
    getByRole('link', { name: 'Need help?' })
  })

  it('proceeding in deck cal session sends save offset and move to point two commands when current step is savingPointOne', () => {
    const { getByRole } = render({
      sessionType: Sessions.SESSION_TYPE_DECK_CALIBRATION,
      currentStep: Sessions.DECK_STEP_SAVING_POINT_ONE,
    })[0]
    getByRole('button', { name: 'Confirm placement' }).click()
    expect(mockSendCommands).toHaveBeenCalledWith(
      {
        command: Sessions.sharedCalCommands.SAVE_OFFSET,
      },
      {
        command: Sessions.deckCalCommands.MOVE_TO_POINT_TWO,
      }
    )
  })
})
