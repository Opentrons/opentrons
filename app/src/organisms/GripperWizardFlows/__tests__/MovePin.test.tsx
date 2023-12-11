import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { instrumentsResponseFixture } from '@opentrons/api-client'
import { i18n } from '../../../i18n'

import { MovePin } from '../MovePin'
import {
  GRIPPER_FLOW_TYPES,
  MOVE_PIN_FROM_FRONT_JAW_TO_REAR_JAW,
  MOVE_PIN_TO_FRONT_JAW,
  REMOVE_PIN_FROM_REAR_JAW,
  SECTIONS,
} from '../constants'
import type { CommandData } from '@opentrons/api-client'

describe('MovePin', () => {
  let mockCreateRunCommand: jest.Mock
  let mockSetErrorMessage: jest.Mock

  const mockGoBack = jest.fn()
  const mockProceed = jest.fn()
  const mockChainRunCommands = jest.fn()
  const mockSetFrontJawOffset = jest.fn()
  const mockRunId = 'fakeRunId'

  const render = (
    props: Partial<React.ComponentProps<typeof MovePin>> = {}
  ) => {
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
        {...props}
      />,
      { i18nInstance: i18n }
    )
  }
  beforeEach(() => {
    mockCreateRunCommand = jest.fn(() => {
      return Promise.resolve({ data: {} } as CommandData)
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('clicking confirm proceed calls proceed with correct callbacks', async () => {
    render()
    const begin = screen.getByRole('button', { name: 'Begin calibration' })
    fireEvent.click(begin)
    await expect(mockCreateRunCommand).toHaveBeenNthCalledWith(1, {
      maintenanceRunId: 'fakeRunId',
      command: {
        commandType: 'home',
        params: { axes: ['extensionZ', 'extensionJaw'] },
      },
      waitUntilComplete: true,
    })
    await expect(mockCreateRunCommand).toHaveBeenNthCalledWith(2, {
      maintenanceRunId: 'fakeRunId',
      command: {
        commandType: 'home',
        params: { skipIfMountPositionOk: 'extension' },
      },
      waitUntilComplete: true,
    })
    await expect(mockCreateRunCommand).toHaveBeenNthCalledWith(3, {
      maintenanceRunId: 'fakeRunId',
      command: {
        commandType: 'calibration/calibrateGripper',
        params: { jaw: 'front' },
      },
      waitUntilComplete: true,
    })
    await expect(mockCreateRunCommand).toHaveBeenNthCalledWith(4, {
      maintenanceRunId: 'fakeRunId',
      command: {
        commandType: 'calibration/moveToMaintenancePosition',
        params: { mount: 'extension' },
      },
      waitUntilComplete: true,
    })
    await expect(mockProceed).toHaveBeenCalled()
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
    screen.getByRole('button', { name: 'Begin calibration' })
  })

  it('renders correct loader for move pin to front jaw', () => {
    render({ isRobotMoving: true })
    screen.getByText('Stand back, gripper is calibrating')
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

    await expect(mockCreateRunCommand).toHaveBeenNthCalledWith(1, {
      maintenanceRunId: 'fakeRunId',
      command: {
        commandType: 'home',
        params: { axes: ['extensionZ', 'extensionJaw'] },
      },
      waitUntilComplete: true,
    })
    await expect(mockCreateRunCommand).toHaveBeenNthCalledWith(2, {
      maintenanceRunId: 'fakeRunId',
      command: {
        commandType: 'home',
        params: { skipIfMountPositionOk: 'extension' },
      },
      waitUntilComplete: true,
    })
    await expect(mockCreateRunCommand).toHaveBeenNthCalledWith(3, {
      maintenanceRunId: 'fakeRunId',
      command: {
        commandType: 'calibration/calibrateGripper',
        params: {
          jaw: 'rear',
          otherJawOffset: { x: 0, y: 0, z: 0 },
        },
      },
      waitUntilComplete: true,
    })
    await expect(mockCreateRunCommand).toHaveBeenNthCalledWith(4, {
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
