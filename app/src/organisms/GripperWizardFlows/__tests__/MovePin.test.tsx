import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'

import { MovePin } from '../MovePin'
import {
  GRIPPER_FLOW_TYPES,
  MOVE_PIN_FROM_FRONT_JAW_TO_REAR_JAW,
  MOVE_PIN_TO_FRONT_JAW,
  REMOVE_PIN_FROM_REAR_JAW,
  SECTIONS,
} from '../constants'

describe('MovePin', () => {
  let render: (
    props?: Partial<React.ComponentProps<typeof MovePin>>
  ) => ReturnType<typeof renderWithProviders>

  const mockGoBack = jest.fn()
  const mockProceed = jest.fn()
  const mockChainRunCommands = jest.fn()
  const mockSetIsBetweenCommands = jest.fn()
  const mockRunId = 'fakeRunId'

  beforeEach(() => {
    render = (props = {}) => {
      return renderWithProviders(
        <MovePin
          runId={mockRunId}
          section={SECTIONS.MOVE_PIN}
          flowType={GRIPPER_FLOW_TYPES.ATTACH}
          proceed={mockProceed}
          attachedGripper={{}}
          chainRunCommands={mockChainRunCommands}
          isRobotMoving={false}
          isExiting={false}
          goBack={mockGoBack}
          setIsBetweenCommands={mockSetIsBetweenCommands}
          movement={MOVE_PIN_TO_FRONT_JAW}
          {...props}
        />,
        { i18nInstance: i18n }
      )
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('clicking confirm proceed calls proceed', () => {
    const { getByRole } = render()[0]
    getByRole('button', { name: 'Begin calibration' }).click()
    expect(mockProceed).toHaveBeenCalled()
  })

  it('clicking go back calls back', () => {
    const { getByLabelText } = render()[0]
    getByLabelText('back').click()
    expect(mockGoBack).toHaveBeenCalled()
  })

  it('renders correct text for move pin to front jaw', () => {
    const { getByRole, getByText } = render()[0]
    getByText('Insert Calibration Pin into Front Jaw')
    getByText(
      'Take the calibration pin from its storage location. Magnetically attach the pin to the hole on the underside of the front gripper jaw.'
    )
    getByRole('button', { name: 'Begin calibration' })
  })

  it('renders correct loader for move pin to front jaw', () => {
    const { getByText } = render({ isRobotMoving: true })[0]
    getByText('Stand Back, Gripper is Calibrating')
  })

  it('renders correct text for move pin from front jaw to rear', () => {
    const { getByRole, getByText } = render({
      movement: MOVE_PIN_FROM_FRONT_JAW_TO_REAR_JAW,
    })[0]
    getByText('Insert Calibration Pin into Rear Jaw')
    getByText(
      'Remove the calibration pin from the front jaw and attach it to the similar location on the rear jaw'
    )
    getByRole('button', { name: 'continue' })
  })

  it('renders correct loader for move pin from front jaw to rear', () => {
    const { getByText } = render({
      isRobotMoving: true,
      movement: MOVE_PIN_FROM_FRONT_JAW_TO_REAR_JAW,
    })[0]
    getByText('Stand Back, Gripper is Calibrating')
  })

  it('renders correct text for remove pin from rear jaw', () => {
    const { getByRole, getByText } = render({
      movement: REMOVE_PIN_FROM_REAR_JAW,
    })[0]
    getByText('Remove Calibration Pin')
    getByText(
      'Take the calibration pin from the rear gripper jaw and return it to its storage location.'
    )
    getByRole('button', { name: 'Complete calibration' })
  })

  it('renders correct loader for remove pin from rear jaw', () => {
    const { getByText } = render({
      isRobotMoving: true,
      movement: REMOVE_PIN_FROM_REAR_JAW,
    })[0]
    getByText('Stand Back, Robot is in Motion')
  })
})
