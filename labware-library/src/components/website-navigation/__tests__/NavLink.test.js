// @flow
// tests for Logo image component
import * as React from 'react'
import { shallow } from 'enzyme'

import { NavLink } from '../NavLink'

const linkProps = {
  name: 'foo',
  url: 'bar',
  gtm: {
    category: 'category',
    label: 'label',
    action: 'click',
  },
}

describe('NavLink', () => {
  test('component renders', () => {
    const tree = shallow(<NavLink {...linkProps} />)

    expect(tree).toMatchSnapshot()
  })

  test('component renders name and optional description from props', () => {
    const props = {
      ...linkProps,
      description: 'some link description',
    }
    const tree = shallow(<NavLink {...props} />)
    expect(tree.find('a').text()).toEqual(props.name)
    expect(tree.find('.link_description').text()).toEqual(props.description)
  })

  test('component renders conditional cta class', () => {
    const tree = shallow(<NavLink {...linkProps} cta={true} />)
    expect(tree.find('a').hasClass('link_cta')).toEqual(true)
  })
})
