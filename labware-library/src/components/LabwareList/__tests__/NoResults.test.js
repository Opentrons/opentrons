// @flow
// NoResults tests
import { shallow } from 'enzyme'
import * as React from 'react'

import { NoResults } from '../NoResults'

describe('NoResults', () => {
  it('component renders', () => {
    expect(shallow(<NoResults />)).toMatchSnapshot()
  })
})
