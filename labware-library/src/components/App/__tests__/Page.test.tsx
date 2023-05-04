// app tests
import { Page } from '../Page'
import { shallow } from 'enzyme'
import * as React from 'react'

jest.mock('../../../definitions')

describe('Page', () => {
  it('component renders sidebar and content', () => {
    const tree = shallow(
      <Page
        scrollRef={{ current: null }}
        sidebar="foo"
        content="bar"
        detailPage={false}
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
        detailPage={true}
      />
    )

    expect(tree).toMatchSnapshot()
  })
})
