import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { instrumentsResponseFixture } from '@opentrons/api-client'
import { i18n } from '../../../i18n'

import { MountGripper } from '../MountGripper'
import { GRIPPER_FLOW_TYPES } from '../constants'

jest.mock('@opentrons/react-api-client')

const mockUseInstrumentsQuery = useInstrumentsQuery as jest.MockedFunction<
  typeof useInstrumentsQuery
>

const mockRunId = 'fakeRunId'

describe('MountGripper', () => {
  let mockRefetch: jest.Mock
  let mockProceed: jest.Mock
  let mockChainRunCommands: jest.Mock
  let mockSetErrorMessage: jest.Mock

  const render = (
    props: Partial<React.ComponentProps<typeof MountGripper>> = {}
  ) => {
    return renderWithProviders(
      <MountGripper
        maintenanceRunId={mockRunId}
        flowType={GRIPPER_FLOW_TYPES.ATTACH}
        proceed={mockProceed}
        attachedGripper={props?.attachedGripper ?? null}
        chainRunCommands={mockChainRunCommands}
        isRobotMoving={false}
        goBack={() => null}
        errorMessage={null}
        setErrorMessage={mockSetErrorMessage}
        {...props}
      />,
      { i18nInstance: i18n }
    )
  }

  beforeEach(() => {
    mockProceed = jest.fn()
    mockChainRunCommands = jest.fn()
    mockRefetch = jest.fn(() => Promise.resolve())
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('clicking confirm calls proceed if attached gripper', () => {
    mockUseInstrumentsQuery.mockReturnValue({
      refetch: mockRefetch,
      data: instrumentsResponseFixture,
    } as any)
    render()
    const button = screen.getByRole('button', { name: 'Continue' })
    fireEvent.click(button)
    expect(mockProceed).toHaveBeenCalled()
  })

  it('clicking confirm shows unable to detect if no gripper attached', async () => {
    mockUseInstrumentsQuery.mockReturnValue({
      refetch: mockRefetch,
      data: null,
    } as any)
    render()
    const continueButton = screen.getByRole('button', { name: 'Continue' })
    fireEvent.click(continueButton)
    expect(mockProceed).not.toHaveBeenCalled()
    screen.getByText('Unable to detect Gripper')
    let tryAgainButton = screen.getByRole('button', { name: 'Try again' })
    fireEvent.click(tryAgainButton)
    expect(mockProceed).not.toHaveBeenCalled()
    tryAgainButton = screen.getByRole('button', { name: 'Try again' })
    fireEvent.click(tryAgainButton)
    const goBackButton = screen.getByRole('button', { name: 'Go back' })
    fireEvent.click(goBackButton)
    const nextContinue = screen.getByRole('button', { name: 'Continue' })
    fireEvent.click(nextContinue)
    expect(mockProceed).not.toHaveBeenCalled()
  })

  it('renders correct text', () => {
    mockUseInstrumentsQuery.mockReturnValue({
      refetch: mockRefetch,
      data: null,
    } as any)
    render()
    screen.getByText('Connect and secure Flex Gripper')
    screen.getByText(
      'Attach the gripper to the robot by aligning the connector and pressing to ensure a secure connection. Hold the gripper in place. Tighten the top gripper screw first, and the bottom screw second. Then test that the gripper is securely attached by gently pulling it side to side.'
    )
  })
})
