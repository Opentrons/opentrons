// @flow
// NoResults tests
import * as React from 'react'
import { shallow } from 'enzyme'

import { NoResults } from '../NoResults'

describe('NoResults', () => {
  test('component renders', () => {
    expect(shallow(<NoResults />)).toMatchSnapshot()
  })
})
