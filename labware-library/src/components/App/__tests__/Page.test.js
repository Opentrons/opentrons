// @flow
// app tests
import * as React from 'react'
import { shallow } from 'enzyme'

import Page from '../Page'

jest.mock('../../../definitions')

describe('Page', () => {
  test('component renders sidebar and content', () => {
    const tree = shallow(
      <Page sidebar="foo" content="bar" sidebarLargeOnly={false} />
    )

    expect(tree).toMatchSnapshot()
  })

  test('component renders with sidebarLargeOnly CSS', () => {
    const tree = shallow(<Page sidebar="foo" content="bar" sidebarLargeOnly />)

    expect(tree).toMatchSnapshot()
  })
})
