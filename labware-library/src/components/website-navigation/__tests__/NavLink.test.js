// @flow
// tests for Logo image component
import { shallow } from 'enzyme'
import * as React from 'react'

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
  it('component renders', () => {
    const tree = shallow(<NavLink {...linkProps} />)

    expect(tree).toMatchSnapshot()
  })

  it('component renders name and optional description from props', () => {
    const props = {
      ...linkProps,
      description: 'some link description',
    }
    const tree = shallow(<NavLink {...props} />)
    expect(tree.find('a').text()).toEqual(props.name)
    expect(tree.find('.link_description').text()).toEqual(props.description)
  })

  it('component renders conditional cta class', () => {
    const tree = shallow(<NavLink {...linkProps} cta={true} />)
    expect(tree.find('a').hasClass('link_cta')).toEqual(true)
  })
})
