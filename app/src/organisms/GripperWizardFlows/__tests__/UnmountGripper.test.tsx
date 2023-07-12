import * as React from 'react'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { renderWithProviders } from '@opentrons/components'
import { instrumentsResponseFixture } from '@opentrons/api-client'
import { i18n } from '../../../i18n'

import { UnmountGripper } from '../UnmountGripper'
import { GRIPPER_FLOW_TYPES } from '../constants'

jest.mock('@opentrons/react-api-client')

const mockUseInstrumentsQuery = useInstrumentsQuery as jest.MockedFunction<
  typeof useInstrumentsQuery
>

const mockRunId = 'fakeRunId'
describe('UnmountGripper', () => {
  let render: (
    props?: Partial<React.ComponentProps<typeof UnmountGripper>>
  ) => ReturnType<typeof renderWithProviders>

  let mockRefetch: jest.Mock
  let mockGoBack: jest.Mock
  let mockProceed: jest.Mock
  let mockChainRunCommands: jest.Mock
  let mockSetShowErrorMessage: jest.Mock

  beforeEach(() => {
    mockGoBack = jest.fn()
    mockProceed = jest.fn()
    mockChainRunCommands = jest.fn(() => Promise.resolve())
    mockRefetch = jest.fn(() => Promise.resolve())
    render = props => {
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
          setShowErrorMessage={mockSetShowErrorMessage}
          {...props}
        />,
        { i18nInstance: i18n }
      )
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('clicking confirm proceed calls home and proceed if gripper detached', async () => {
    mockUseInstrumentsQuery.mockReturnValue({
      refetch: mockRefetch,
      data: null,
    } as any)
    const { getByRole } = render({ attachedGripper: null })[0]
    await getByRole('button', { name: 'Continue' }).click()
    await expect(mockChainRunCommands).toHaveBeenCalledWith(
      [{ commandType: 'home', params: {} }],
      true
    )
    expect(mockProceed).toHaveBeenCalled()
  })

  it('clicking go back calls back', () => {
    mockUseInstrumentsQuery.mockReturnValue({
      refetch: mockRefetch,
      data: instrumentsResponseFixture,
    } as any)
    const { getByLabelText } = render()[0]
    getByLabelText('back').click()
    expect(mockGoBack).toHaveBeenCalled()
  })

  it('renders correct text', () => {
    mockUseInstrumentsQuery.mockReturnValue({
      refetch: mockRefetch,
      data: instrumentsResponseFixture,
    } as any)
    const { getByText } = render()[0]
    getByText('Loosen Screws and Detach')
    getByText(
      'Hold the gripper in place and loosen the screws. (The screws are captive and will not come apart from the gripper) Then carefully remove the gripper'
    )
  })
})
