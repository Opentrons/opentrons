import * as React from 'react'
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
  let render: (
    props?: Partial<React.ComponentProps<typeof MountGripper>>
  ) => ReturnType<typeof renderWithProviders>
  let mockRefetch: jest.Mock
  let mockGoBack: jest.Mock
  let mockProceed: jest.Mock
  let mockChainRunCommands: jest.Mock
  let mockSetErrorMessage: jest.Mock

  beforeEach(() => {
    mockGoBack = jest.fn()
    mockProceed = jest.fn()
    mockChainRunCommands = jest.fn()
    mockRefetch = jest.fn(() => Promise.resolve())
    render = (props = {}) => {
      return renderWithProviders(
        <MountGripper
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
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('clicking confirm calls proceed if attached gripper', async () => {
    mockUseInstrumentsQuery.mockReturnValue({
      refetch: mockRefetch,
      data: instrumentsResponseFixture,
    } as any)
    const { getByRole } = render()[0]
    await getByRole('button', { name: 'Continue' }).click()
    expect(mockProceed).toHaveBeenCalled()
  })

  it('clicking confirm shows unable to detect if no gripper attached', async () => {
    mockUseInstrumentsQuery.mockReturnValue({
      refetch: mockRefetch,
      data: null,
    } as any)
    const { getByRole, getByText } = render()[0]
    await getByRole('button', { name: 'Continue' }).click()
    expect(mockProceed).not.toHaveBeenCalled()
    await getByText('Unable to detect Gripper')
    let tryAgainButton = getByRole('button', { name: 'Try again' })
    tryAgainButton.click()
    expect(mockProceed).not.toHaveBeenCalled()
    tryAgainButton = getByRole('button', { name: 'Try again' })
    tryAgainButton.click()
    const goBackButton = await getByRole('button', { name: 'Go back' })
    goBackButton.click()
    await getByRole('button', { name: 'Continue' }).click()
    expect(mockProceed).not.toHaveBeenCalled()
  })

  it('clicking go back calls back', () => {
    mockUseInstrumentsQuery.mockReturnValue({
      refetch: mockRefetch,
      data: null,
    } as any)
    const { getByLabelText } = render()[0]
    getByLabelText('back').click()
    expect(mockGoBack).toHaveBeenCalled()
  })

  it('renders correct text', () => {
    mockUseInstrumentsQuery.mockReturnValue({
      refetch: mockRefetch,
      data: null,
    } as any)
    const { getByText } = render()[0]
    getByText('Connect and Screw In Gripper')
    getByText(
      'Attach the gripper to the robot by aligning the connector and ensuring a secure connection. Hold the gripper in place and use the hex screwdriver to tighten the gripper screws. Then test that the gripper is securely attached by gently pulling it side to side.'
    )
  })
})
