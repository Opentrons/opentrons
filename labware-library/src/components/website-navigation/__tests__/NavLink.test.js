// @flow
// tests for Logo image component
import * as React from 'react'
import { shallow } from 'enzyme'

import NavLink from '../NavLink'

describe('NavLink', () => {
  test('component renders', () => {
    const tree = shallow(<NavLink name="foo" url="bar" />)

    expect(tree).toMatchSnapshot()
  })

  test('component renders name and optional description from props', () => {
    const props = {
      name: 'some link',
      url: '#',
      description: 'some link description',
    }
    const tree = shallow(<NavLink {...props} />)
    expect(tree.find('a').text()).toEqual(props.name)
    expect(tree.find('.link_description').text()).toEqual(props.description)
  })

  test('component renders conditional cta class', () => {
    const tree = shallow(<NavLink name="foo" cta={true} />)
    expect(tree.find('a').hasClass('link_cta')).toEqual(true)
  })
})
