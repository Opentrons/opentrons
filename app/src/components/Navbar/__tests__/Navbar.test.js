// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { Provider } from 'react-redux'
import noop from 'lodash/noop'

import {
  Flex,
  DIRECTION_COLUMN,
  FLEX_NONE,
  SIZE_3,
} from '@opentrons/components'
import * as Nav from '../../../nav'
import { Navbar } from '..'
import { NavbarLink } from '../NavbarLink'

import type { State } from '../../../types'
import type { NavLocation } from '../../../nav/types'

jest.mock('react-router-dom', () => ({ NavLink: 'a' }))
jest.mock('../../../nav/selectors')

const getNavbarLocations: JestMockFn<[State], Array<NavLocation>> =
  Nav.getNavbarLocations

const LOCATIONS = [
  { id: 'foo', path: '/foo', title: 'Foo', iconName: 'alert' },
  { id: 'bar', path: '/bar', title: 'Bar', iconName: 'alert' },
  { id: 'baz', path: '/baz', title: 'Baz', iconName: 'alert' },
]

describe('Navbar component', () => {
  const store = {
    getState: () => ({ mockState: true }),
    dispatch: noop,
    subscribe: noop,
  }

  const render = () => {
    return mount(<Navbar />, {
      wrappingComponent: Provider,
      wrappingComponentProps: { store },
    })
  }

  beforeEach(() => {
    getNavbarLocations.mockImplementation(state => {
      expect(state).toEqual({ mockState: true })
      return LOCATIONS
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render a NavbarLink for every nav location', () => {
    const wrapper = render()
    const links = wrapper.find(NavbarLink)

    expect(links.length).toBe(LOCATIONS.length)
    expect(links.at(0).props()).toMatchObject(LOCATIONS[0])
    expect(links.at(1).props()).toMatchObject(LOCATIONS[1])
    expect(links.at(2).props()).toMatchObject(LOCATIONS[2])
  })

  it('should be a flex column', () => {
    const wrapper = render()
    const column = wrapper.find(Flex)

    expect(column.prop('flexDirection')).toBe(DIRECTION_COLUMN)
    expect(column.prop('flex')).toBe(FLEX_NONE)
    expect(column.prop('width')).toBe(SIZE_3)
  })
})
