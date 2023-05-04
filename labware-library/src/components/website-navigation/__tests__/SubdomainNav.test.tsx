// tests for top navbar
import { SubdomainNav, SUBDOMAIN_NAV_LINKS } from '..'
import { shallow } from 'enzyme'
import * as React from 'react'

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
