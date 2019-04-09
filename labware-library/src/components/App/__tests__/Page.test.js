// @flow
// app tests
import * as React from 'react'
import { shallow } from 'enzyme'

import Page from '../Page'

jest.mock('../../../definitions')

describe('Page', () => {
  test('component renders', () => {
    const tree = shallow(<Page location={({ search: '' }: any)} />)

    expect(tree).toMatchSnapshot()
  })
})
