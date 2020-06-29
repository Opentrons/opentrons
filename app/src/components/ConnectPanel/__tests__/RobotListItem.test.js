// @flow
import { NotificationIcon, ToggleButton } from '@opentrons/components'
import { shallow } from 'enzyme'
import * as React from 'react'

import { RobotListItem } from '../RobotListItem'

describe('ConnectPanel RobotListItem', () => {
  const handleToggleConnect = jest.fn()

  const render = ({
    name = 'robot-name',
    displayName = 'robot-display-name',
    isConnectable = false,
    isUpgradable = false,
    isSelected = false,
    isLocal = false,
    isConnected = false,
    connectToggleDisabled = false,
    onToggleConnect = handleToggleConnect,
  } = {}) => {
    return shallow(
      <RobotListItem
        {...{
          name,
          displayName,
          isConnectable,
          isUpgradable,
          isSelected,
          isLocal,
          isConnected,
          onToggleConnect,
        }}
      />
    )
  }

  it("renders the robot's displayName in a RobotLink", () => {
    const wrapper = render()
    const link = wrapper.find('RobotLink[url="/robots/robot-name"]')

    expect(link.find('p').html()).toContain('robot-display-name')
  })

  it('renders a local notification icon', () => {
    const wrapper = render({ isLocal: true })
    const icon = wrapper.find(NotificationIcon)

    expect(icon.prop('name')).toBe('usb')
    expect(icon.prop('childName')).toBe(null)
  })

  it('renders a non-local notification icon', () => {
    const wrapper = render({ isLocal: false })
    const icon = wrapper.find(NotificationIcon)

    expect(icon.prop('name')).toBe('wifi')
    expect(icon.prop('childName')).toBe(null)
  })

  it('renders a notification icon with dot if upgradable', () => {
    const wrapper = render({ isUpgradable: true })
    const icon = wrapper.find(NotificationIcon)

    expect(icon.prop('childName')).toBe('circle')
  })

  it('renders an instruments link if connectable and selected', () => {
    let wrapper = render({ isConnectable: true, isSelected: true })
    let link = wrapper.find('RobotLink[url="/robots/robot-name/instruments"]')

    expect(link.find('p').html()).toMatch(/pipettes.+modules/i)

    wrapper = render({ isConnectable: true, isSelected: false })
    link = wrapper.find('RobotLink[url="/robots/robot-name/instruments"]')

    expect(link).toHaveLength(0)

    wrapper = render({ isConnectable: false, isSelected: true })
    link = wrapper.find('RobotLink[url="/robots/robot-name/instruments"]')

    expect(link).toHaveLength(0)
  })

  it('renders a connection toggle button if connectable', () => {
    const wrapper = render({ isConnectable: true, isSelected: false })
    const toggle = wrapper.find(ToggleButton)

    toggle.invoke('onClick')()
    expect(handleToggleConnect).toHaveBeenCalled()
  })

  it('renders a chevron-right instead of toggle if not connectable', () => {
    const wrapper = render({ isConnectable: false, isSelected: false })
    const toggle = wrapper.find(ToggleButton)
    const chevron = wrapper.find('Icon[name="chevron-right"]')

    expect(toggle).toHaveLength(0)
    expect(chevron).toHaveLength(1)
  })

  it('renders a connection toggle depends on isConnected', () => {
    let wrapper = render({ isConnectable: true, isConnected: false })
    let toggle = wrapper.find(ToggleButton)

    expect(toggle.prop('toggledOn')).toBe(false)

    wrapper = render({ isConnectable: true, isConnected: true })
    toggle = wrapper.find(ToggleButton)

    expect(toggle.prop('toggledOn')).toBe(true)
  })
})
