import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { instrumentsResponseFixture } from '@opentrons/api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import {
  GRIPPER_FLOW_TYPES,
  MOVE_PIN_FROM_FRONT_JAW_TO_REAR_JAW,
  MOVE_PIN_TO_FRONT_JAW,
  REMOVE_PIN_FROM_REAR_JAW,
  SECTIONS,
} from '../constants'
import { calibrateGripperJaw, MovePin } from '../MovePin'

import type { ComponentProps } from 'react'
import type { CommandData } from '@opentrons/api-client'

describe('MovePin', () => {
  let mockCreateRunCommand: any
  let mockSetErrorMessage: any

  const mockGoBack = vi.fn()
  const mockProceed = vi.fn()
  const mockChainRunCommands = vi.fn()
  const mockSetFrontJawOffset = vi.fn()
  const mockRunId = 'fakeRunId'

  const render = (props: Partial<ComponentProps<typeof MovePin>> = {}) => {
    return renderWithProviders(
      <MovePin
        maintenanceRunId={mockRunId}
        section={SECTIONS.MOVE_PIN}
        flowType={GRIPPER_FLOW_TYPES.ATTACH}
        proceed={mockProceed}
        attachedGripper={instrumentsResponseFixture.data[0]}
        chainRunCommands={mockChainRunCommands}
        isRobotMoving={false}
        goBack={mockGoBack}
        movement={MOVE_PIN_TO_FRONT_JAW}
        setFrontJawOffset={mockSetFrontJawOffset}
        frontJawOffset={{ x: 0, y: 0, z: 0 }}
        createRunCommand={mockCreateRunCommand}
        errorMessage={null}
        setErrorMessage={mockSetErrorMessage}
        isExiting={false}
        selectedSlot="B2"
        {...props}
      />,
      { i18nInstance: i18n }
    )
  }
  beforeEach(() => {
    mockCreateRunCommand = vi.fn(() => {
      return Promise.resolve({ data: {} } as CommandData)
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('clicking continue on insert pin only proceeds', () => {
    render()
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(mockProceed).toHaveBeenCalled()
    expect(mockCreateRunCommand).not.toHaveBeenCalled()
  })

  it('clicking go back calls back on moving pin from front to rear jaw', () => {
    render({ movement: MOVE_PIN_FROM_FRONT_JAW_TO_REAR_JAW })
    const back = screen.getByLabelText('back')
    fireEvent.click(back)
    expect(mockGoBack).toHaveBeenCalled()
  })

  it('clicking go back calls back on removing pin from rear jaw', () => {
    render({ movement: REMOVE_PIN_FROM_REAR_JAW })
    const back = screen.getByLabelText('back')
    fireEvent.click(back)
    expect(mockGoBack).toHaveBeenCalled()
  })

  it('renders correct text for move pin to front jaw', () => {
    render()
    screen.getByText('Insert calibration pin in front jaw')
    screen.getByText(
      'Take the calibration pin from its storage location. Magnetically attach the pin to the hole on the underside of the front gripper jaw.'
    )
    screen.getByRole('button', { name: 'Continue' })
  })

  it('renders correct loader for move pin to front jaw', () => {
    render({ isRobotMoving: true })
    screen.getByText('Stand back, gripper is calibrating')
    screen.getByText(
      'The calibration pin will touch the calibration square in slot B2 to determine its exact position.'
    )
  })

  it('sends the selected slot in the front jaw calibrate helper', async () => {
    const proceed = vi.fn()
    const setErrorMessage = vi.fn()
    const setFrontJawOffset = vi.fn()
    calibrateGripperJaw({
      maintenanceRunId: mockRunId,
      createRunCommand: mockCreateRunCommand,
      setErrorMessage,
      proceed,
      jaw: 'front',
      selectedSlot: 'C2',
      frontJawOffset: null,
      setFrontJawOffset,
    })
    await new Promise(resolve => setTimeout(resolve))
    expect(mockCreateRunCommand).toHaveBeenNthCalledWith(3, {
      maintenanceRunId: 'fakeRunId',
      command: {
        commandType: 'calibration/calibrateGripper',
        params: { jaw: 'front', slot: 'C2' },
      },
      waitUntilComplete: true,
    })
    expect(proceed).toHaveBeenCalled()
  })

  it('uses the selected slot in in-progress copy', () => {
    render({ isRobotMoving: true, selectedSlot: 'C2' })
    screen.getByText(
      'The calibration pin will touch the calibration square in slot C2 to determine its exact position.'
    )
  })

  it('renders correct text for move pin from front jaw to rear with correct callbacks', async () => {
    render({ movement: MOVE_PIN_FROM_FRONT_JAW_TO_REAR_JAW })
    screen.getByText('Insert calibration pin in rear jaw')
    screen.getByText(
      'Remove the calibration pin from the front jaw and attach it to the rear jaw.'
    )
    const continueButton = screen.getByRole('button', {
      name: 'Continue calibration',
    })
    fireEvent.click(continueButton)
    await new Promise((resolve, reject) => setTimeout(resolve))
    expect(mockCreateRunCommand).toHaveBeenNthCalledWith(1, {
      maintenanceRunId: 'fakeRunId',
      command: {
        commandType: 'home',
        params: { axes: ['extensionZ', 'extensionJaw'] },
      },
      waitUntilComplete: true,
    })
    expect(mockCreateRunCommand).toHaveBeenNthCalledWith(2, {
      maintenanceRunId: 'fakeRunId',
      command: {
        commandType: 'home',
        params: { skipIfMountPositionOk: 'extension' },
      },
      waitUntilComplete: true,
    })
    expect(mockCreateRunCommand).toHaveBeenNthCalledWith(3, {
      maintenanceRunId: 'fakeRunId',
      command: {
        commandType: 'calibration/calibrateGripper',
        params: {
          jaw: 'rear',
          otherJawOffset: { x: 0, y: 0, z: 0 },
          slot: 'B2',
        },
      },
      waitUntilComplete: true,
    })
    expect(mockCreateRunCommand).toHaveBeenNthCalledWith(4, {
      maintenanceRunId: 'fakeRunId',
      command: {
        commandType: 'calibration/moveToMaintenancePosition',
        params: { mount: 'extension' },
      },
      waitUntilComplete: true,
    })
    await expect(mockProceed).toHaveBeenCalled()
  })

  it('renders correct loader for move pin from front jaw to rear', () => {
    render({
      isRobotMoving: true,
      movement: MOVE_PIN_FROM_FRONT_JAW_TO_REAR_JAW,
    })
    screen.getByText('Stand back, gripper is calibrating')
  })

  it('renders correct text for remove pin from rear jaw', () => {
    render({ movement: REMOVE_PIN_FROM_REAR_JAW })
    screen.getByText('Remove calibration pin')
    screen.getByText(
      'Take the calibration pin from the rear gripper jaw and return it to its storage location.'
    )
    const complete = screen.getByRole('button', {
      name: 'Complete calibration',
    })
    fireEvent.click(complete)
    expect(mockProceed).toHaveBeenCalled()
  })

  it('renders correct loader for remove pin from rear jaw', () => {
    render({
      isRobotMoving: true,
      movement: REMOVE_PIN_FROM_REAR_JAW,
    })
    screen.getByText('Stand back, robot is in motion')
  })

  it('renders correct loader for early exiting', () => {
    render({
      isRobotMoving: true,
      isExiting: true,
      movement: MOVE_PIN_FROM_FRONT_JAW_TO_REAR_JAW,
    })
    screen.getByText('Stand back, robot is in motion')
  })
})
