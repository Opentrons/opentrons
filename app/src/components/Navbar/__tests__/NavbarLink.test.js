// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { NavLink, StaticRouter } from 'react-router-dom'
import { Tooltip, NotificationIcon } from '@opentrons/components'

import { NavbarLink } from '../NavBarLink'
import type { NavbarLinkProps } from '../NavBarLink'

jest.mock('@opentrons/components/src/tooltips/useTooltip', () => ({
  useTooltip: () => [{}, {}],
}))

describe('NavBarLink component', () => {
  const render = (props: NavbarLinkProps, location: string = '/') => {
    return mount(<NavbarLink {...props} />, {
      wrappingComponent: StaticRouter,
      wrappingComponentProps: { location, context: {} },
    })
  }

  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  it('should render a NavLink with no tooltip', () => {
    const wrapper = render({
      id: 'foo',
      path: '/foo',
      title: 'Foo',
      iconName: 'alert',
    })
    const link = wrapper.find(NavLink)

    expect(link.prop('to')).toBe('/foo')
    expect(wrapper.exists(Tooltip)).toBe(false)
  })

  it('should render not render a NavLink if the location is disabled', () => {
    const wrapper = render({
      id: 'foo',
      path: '/foo',
      title: 'Foo',
      iconName: 'alert',
      disabledReason: 'ah!',
    })

    expect(wrapper.exists(NavLink)).toBe(false)
  })

  it('should render a Tooltip if the location is disabled', () => {
    const wrapper = render({
      id: 'foo',
      path: '/foo',
      title: 'Foo',
      iconName: 'alert',
      disabledReason: 'ah!',
    })

    // TODO(mc, 2020-07-01): figure out a good testing stratgey for
    // useHoverTooltip so we can test tooltip contents
    expect(wrapper.exists(Tooltip)).toBe(true)
  })

  it('should render a Tooltip if the location has a notification', () => {
    const wrapper = render({
      id: 'foo',
      path: '/foo',
      title: 'Foo',
      iconName: 'alert',
      notificationReason: 'ah!',
    })

    // TODO(mc, 2020-07-01): figure out a good testing stratgey for
    // useHoverTooltip so we can test tooltip contents
    expect(wrapper.exists(Tooltip)).toBe(true)
  })

  it('should render a NotificationIcon', () => {
    const wrapper = render({
      id: 'foo',
      path: '/foo',
      title: 'Foo',
      iconName: 'alert',
    })
    const icon = wrapper.find(NotificationIcon)

    expect(icon.prop('name')).toBe('alert')
    expect(icon.prop('childName')).toBe(null)
  })

  it('should render a notification if there is a reason to', () => {
    const wrapper = render({
      id: 'foo',
      path: '/foo',
      title: 'Foo',
      iconName: 'alert',
      notificationReason: 'hello',
    })
    const icon = wrapper.find(NotificationIcon)

    expect(icon.prop('name')).toBe('alert')
    expect(icon.prop('childName')).toBe('circle')
  })

  it('should render the link title', () => {
    const wrapper = render({
      id: 'foo',
      path: '/foo',
      title: 'Foo',
      iconName: 'alert',
    })

    expect(wrapper.html()).toContain('Foo')
  })
})
