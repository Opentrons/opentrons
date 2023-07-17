// app tests
import * as React from 'react'
import { shallow } from 'enzyme'

import { Page } from '../Page'

jest.mock('../../../definitions')

describe('Page', () => {
  it('component renders sidebar and content', () => {
    const tree = shallow(
      <Page
        scrollRef={{ current: null }}
        sidebar="foo"
        content="bar"
        isDetailPage={false}
      />
    )

    expect(tree).toMatchSnapshot()
  })

  it('component renders with detailPage CSS', () => {
    const tree = shallow(
      <Page
        scrollRef={{ current: null }}
        sidebar="foo"
        content="bar"
        isDetailPage={true}
      />
    )

    expect(tree).toMatchSnapshot()
  })
})
