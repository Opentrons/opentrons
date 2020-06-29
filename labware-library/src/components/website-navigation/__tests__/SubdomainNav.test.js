// @flow
// tests for top navbar
import { shallow } from 'enzyme'
import * as React from 'react'

import { SUBDOMAIN_NAV_LINKS, SubdomainNav } from '..'

describe('SecondaryNav', () => {
  it('component renders', () => {
    const tree = shallow(<SubdomainNav />)

    expect(tree).toMatchSnapshot()
  })

  it('<li> rendered match link data', () => {
    const tree = shallow(<SubdomainNav />)

    expect(tree.find('li')).toHaveLength(SUBDOMAIN_NAV_LINKS.length)
  })
})
