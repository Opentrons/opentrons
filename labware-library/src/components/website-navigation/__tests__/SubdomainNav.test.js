// @flow
// tests for top navbar
import * as React from 'react'
import { shallow } from 'enzyme'

import { SubdomainNav, SUBDOMAIN_NAV_LINKS } from '..'

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
