import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'

import { UnmountGripper } from '../UnmountGripper'
import { GRIPPER_FLOW_TYPES } from '../constants'

describe('UnmountGripper', () => {
  let render: (
    props?: Partial<React.ComponentProps<typeof UnmountGripper>>
  ) => ReturnType<typeof renderWithProviders>

  const mockGoBack = jest.fn()
  const mockProceed = jest.fn()
  const mockChainRunCommands = jest.fn()
  const mockSetIsBetweenCommands = jest.fn()
  const mockRunId = 'fakeRunId'

  beforeEach(() => {
    render = (props = {}) => {
      return renderWithProviders(
        <UnmountGripper
          runId={mockRunId}
          flowType={GRIPPER_FLOW_TYPES.ATTACH}
          proceed={mockProceed}
          attachedGripper={{}}
          chainRunCommands={mockChainRunCommands}
          isRobotMoving={false}
          goBack={mockGoBack}
          setIsBetweenCommands={mockSetIsBetweenCommands}
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
    getByRole('button', { name: 'continue' }).click()
    expect(mockProceed).toHaveBeenCalled()
  })

  it('clicking go back calls back', () => {
    const { getByRole } = render()[0]
    getByRole('button', { name: 'Go back' }).click()
    expect(mockGoBack).toHaveBeenCalled()
  })

  it('renders correct text', () => {
    const { getByRole, getByText } = render()[0]
    getByRole('heading', { name: 'Loosen Screws and Detach' })
    getByText(
      'Hold the gripper in place and loosen the screws. (The screws are captive and will not come apart from the gripper) Then carefully remove the gripper'
    )
  })
})
