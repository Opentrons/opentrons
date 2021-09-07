import * as React from 'react'
import { mount } from 'enzyme'

import { useConfirmCrashRecovery } from '../useConfirmCrashRecovery'
import type { Props } from '../useConfirmCrashRecovery'
import type { CalibrationLabware } from '../../../redux/sessions/types'
import type {
  LabwareDefinition2,
  LabwareMetadata,
} from '@opentrons/shared-data'
import type { ReactWrapper, HTMLAttributes } from 'enzyme'

describe('useConfirmCrashRecovery', () => {
  let render: (props?: Partial<Props>) => ReactWrapper<Props>
  const mockSendCommands = jest.fn()
  const mockTipRack: Partial<CalibrationLabware> = {
    slot: '4',
    definition: {
      metadata: {
        displayName: 'my tiprack',
      } as LabwareMetadata,
    } as LabwareDefinition2,
  }

  const getStarterLink = (
    wrapper: ReactWrapper<Props>
  ): ReactWrapper<HTMLAttributes> => wrapper.find('a')
  const getModal = (wrapper: ReactWrapper<Props>): ReactWrapper =>
    wrapper.find('ConfirmCrashRecoveryModal')
  const getExitButton = (
    wrapper: ReactWrapper<Props>
  ): ReactWrapper<HTMLAttributes> =>
    wrapper.find('OutlineButton[children="cancel"]')
  const getRestartButton = (
    wrapper: ReactWrapper<Props>
  ): ReactWrapper<HTMLAttributes> => wrapper.find('OutlineButton').at(1)

  const TestUseConfirmCrashRecovery = (props: Partial<Props>): JSX.Element => {
    const {
      requiresNewTip = false,
      sendCommands = mockSendCommands,
      tipRack = mockTipRack,
    } = props
    const [starterText, maybeModal] = useConfirmCrashRecovery({
      ...props,
      requiresNewTip: requiresNewTip,
      sendCommands: sendCommands,
      tipRack: tipRack as CalibrationLabware,
    } as any)
    return (
      <>
        {starterText}
        {maybeModal}
      </>
    )
  }
  beforeEach(() => {
    render = (props: Partial<Props> = {}) => {
      return mount(<TestUseConfirmCrashRecovery {...props} />)
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders the starter link text', () => {
    const wrapper = render()
    expect(getStarterLink(wrapper).exists()).toBe(true)
  })

  it('renders the modal with the right props when you click the link', () => {
    const wrapper = render()
    getStarterLink(wrapper).invoke('onClick')?.({} as React.MouseEvent)
    wrapper.update()
    expect(getModal(wrapper).exists()).toBe(true)
    expect(getModal(wrapper).prop('requiresNewTip')).toBe(false)
    expect(getModal(wrapper).prop('tipRackSlot')).toEqual('4')
    expect(getModal(wrapper).prop('tipRackDisplayName')).toEqual('my tiprack')
  })

  it('invokes invalidate_last_action when you click confirm', () => {
    const wrapper = render()
    getStarterLink(wrapper).invoke('onClick')?.({} as React.MouseEvent)
    wrapper.update()
    getRestartButton(wrapper).invoke('onClick')?.({} as React.MouseEvent)
    wrapper.update()
    expect(mockSendCommands).toHaveBeenCalledWith({
      command: 'calibration.invalidateLastAction',
    })
  })

  it('stops rendering the modal when you click cancel', () => {
    const wrapper = render()
    getStarterLink(wrapper).invoke('onClick')?.({} as React.MouseEvent)
    wrapper.update()
    expect(getModal(wrapper).exists()).toBe(true)
    getExitButton(wrapper).invoke('onClick')?.({} as React.MouseEvent)
    wrapper.update()
    expect(getModal(wrapper).exists()).toBe(false)
  })
})
