import * as React from 'react'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { renderWithProviders } from '@opentrons/components'
import { instrumentsResponseFixture } from '@opentrons/api-client'
import { i18n } from '../../../i18n'

import { UnmountGripper } from '../UnmountGripper'
import { GRIPPER_FLOW_TYPES } from '../constants'
import { fireEvent, screen, waitFor } from '@testing-library/react'

jest.mock('@opentrons/react-api-client')

const mockUseInstrumentsQuery = useInstrumentsQuery as jest.MockedFunction<
  typeof useInstrumentsQuery
>

const mockRunId = 'fakeRunId'
describe('UnmountGripper', () => {
  let mockRefetch: jest.Mock
  let mockGoBack: jest.Mock
  let mockProceed: jest.Mock
  let mockChainRunCommands: jest.Mock
  let mockSetErrorMessage: jest.Mock
  const render = (
    props: Partial<React.ComponentProps<typeof UnmountGripper>> = {}
  ) => {
    return renderWithProviders(
      <UnmountGripper
        maintenanceRunId={mockRunId}
        flowType={GRIPPER_FLOW_TYPES.ATTACH}
        proceed={mockProceed}
        attachedGripper={props?.attachedGripper ?? null}
        chainRunCommands={mockChainRunCommands}
        isRobotMoving={false}
        goBack={mockGoBack}
        errorMessage={null}
        setErrorMessage={mockSetErrorMessage}
        {...props}
      />,
      { i18nInstance: i18n }
    )
  }

  beforeEach(() => {
    mockGoBack = jest.fn()
    mockProceed = jest.fn()
    mockChainRunCommands = jest.fn(() => Promise.resolve())
    mockRefetch = jest.fn(() => Promise.resolve())
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('clicking confirm proceed calls home and proceed if gripper detached', async () => {
    mockUseInstrumentsQuery.mockReturnValue({
      refetch: mockRefetch,
      data: null,
    } as any)
    render({ attachedGripper: null })
    const continueButton = screen.getByRole('button', { name: 'Continue' })
    fireEvent.click(continueButton)
    await waitFor(() => {
      expect(mockChainRunCommands).toHaveBeenCalledWith(
        [{ commandType: 'home', params: {} }],
        true
      )
    })
    expect(mockProceed).toHaveBeenCalled()
  })

  it('clicking go back calls back', () => {
    mockUseInstrumentsQuery.mockReturnValue({
      refetch: mockRefetch,
      data: instrumentsResponseFixture,
    } as any)
    render()
    const back = screen.getByLabelText('back')
    fireEvent.click(back)
    expect(mockGoBack).toHaveBeenCalled()
  })

  it('renders correct text', () => {
    mockUseInstrumentsQuery.mockReturnValue({
      refetch: mockRefetch,
      data: instrumentsResponseFixture,
    } as any)
    render()
    screen.getByText('Loosen screws and detach Flex Gripper')
    screen.getByText(
      'Hold the gripper in place and loosen the top gripper screw first. After that move onto the bottom screw. (The screws are captive and will not come apart from the gripper.) Then carefully remove the gripper.'
    )
  })
})
