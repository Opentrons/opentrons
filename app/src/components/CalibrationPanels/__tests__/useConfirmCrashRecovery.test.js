// @flow

import * as React from 'react'
import { mount } from 'enzyme'

import { useConfirmCrashRecovery } from '../useConfirmCrashRecovery'
import type { Props } from '../useConfirmCrashRecovery'
import type { CalibrationLabware } from '../../../sessions/types'
import type {
  LabwareDefinition2,
  LabwareMetadata,
} from '@opentrons/shared-data'

describe('useConfirmCrashRecovery', () => {
  let render
  const mockSendCommands = jest.fn()
  const mockTipRack: $Shape<CalibrationLabware> = {
    slot: '4',
    definition: ({
      metadata: ({
        displayName: 'my tiprack',
      }: $Shape<LabwareMetadata>),
    }: $Shape<LabwareDefinition2>),
  }

  const getStarterLink = wrapper => wrapper.find('a')
  const getModal = wrapper => wrapper.find('ConfirmCrashRecoveryModal')
  const getExitButton = wrapper =>
    wrapper.find('OutlineButton[children="cancel"]')
  const getRestartButton = wrapper => wrapper.find('OutlineButton').at(1)

  const TestUseConfirmCrashRecovery = (props: $Shape<Props>) => {
    const {
      requiresNewTip = false,
      sendCommands = mockSendCommands,
      tipRack = mockTipRack,
    } = props
    const [starterText, maybeModal] = useConfirmCrashRecovery({
      ...props,
      requiresNewTip: requiresNewTip,
      sendCommands: sendCommands,
      tipRack: tipRack,
    })
    return (
      <>
        {starterText}
        {maybeModal}
      </>
    )
  }
  beforeEach(() => {
    render = (props: $Shape<Props> = {}) => {
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
    getStarterLink(wrapper).invoke('onClick')()
    wrapper.update()
    expect(getModal(wrapper).exists()).toBe(true)
    expect(getModal(wrapper).prop('requiresNewTip')).toBe(false)
    expect(getModal(wrapper).prop('tipRackSlot')).toEqual('4')
    expect(getModal(wrapper).prop('tipRackDisplayName')).toEqual('my tiprack')
  })

  it('invokes invalidate_last_action when you click confirm', () => {
    const wrapper = render()
    getStarterLink(wrapper).invoke('onClick')()
    wrapper.update()
    getRestartButton(wrapper).invoke('onClick')()
    wrapper.update()
    expect(mockSendCommands).toHaveBeenCalledWith({
      command: 'calibration.invalidateLastAction',
    })
  })

  it('stops rendering the modal when you click cancel', () => {
    const wrapper = render()
    getStarterLink(wrapper).invoke('onClick')()
    wrapper.update()
    expect(getModal(wrapper).exists()).toBe(true)
    getExitButton(wrapper).invoke('onClick')()
    wrapper.update()
    expect(getModal(wrapper).exists()).toBe(false)
  })
})
