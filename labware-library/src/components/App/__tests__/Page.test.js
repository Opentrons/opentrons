// @flow
// app tests
import * as React from 'react'
import { shallow } from 'enzyme'

import Page from '../Page'

jest.mock('../../../definitions')

describe('Page', () => {
  test('component renders sidebar and content', () => {
    const tree = shallow(
      <Page
        sidebar="foo"
        content="bar"
        sidebarLargeOnly={false}
        sidebarXlOnly={false}
      />
    )

    expect(tree).toMatchSnapshot()
  })

  test('component renders with sidebarLargeOnly CSS', () => {
    const tree = shallow(
      <Page
        sidebar="foo"
        content="bar"
        sidebarLargeOnly
        sidebarXlOnly={false}
      />
    )

    expect(tree).toMatchSnapshot()
  })

  test('component renders with sidebarXLOnly CSS', () => {
    const tree = shallow(
      <Page
        sidebar="foo"
        content="bar"
        sidebarLargeOnly={false}
        sidebarXlOnly
      />
    )

    expect(tree).toMatchSnapshot()
  })
})
