// @flow
// NoResults tests
import * as React from 'react'
import { shallow } from 'enzyme'

import { NoResults } from '../NoResults'

describe('NoResults', () => {
  it('component renders', () => {
    expect(shallow(<NoResults />)).toMatchSnapshot()
  })
})
