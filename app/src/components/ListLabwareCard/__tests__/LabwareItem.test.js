// @flow
import * as React from 'react'
import { shallow, mount } from 'enzyme'

import LabwareItem from '../LabwareItem'

describe('LabwareItem', () => {
  // Oct 21, 2019, 20:00:00 UTC
  const dateAdded = 1571688000000

  const element = (
    <LabwareItem
      name="foo_bar"
      version={2}
      displayName="Foo Bar"
      displayCategory="wellPlate"
      dateAdded={dateAdded}
    />
  )

  test('component renders', () => {
    const tree = shallow(element)

    expect(tree).toMatchSnapshot()
  })

  test('is a <li>', () => {
    const tree = mount(element)

    expect(tree.getDOMNode().tagName).toBe('LI')
  })

  describe('renders props', () => {
    const html = mount(element).html()

    test('load name', () => expect(html).toContain('foo_bar'))
    test('display name', () => expect(html).toContain('Foo Bar'))
    test('display category', () => expect(html).toContain('Well Plate'))
    test('version', () => expect(html).toContain('v2'))
    test('dateAdded', () => expect(html).toContain('2019-10-21'))
  })
})
