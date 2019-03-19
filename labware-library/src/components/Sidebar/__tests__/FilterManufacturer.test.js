// @flow
// FilterManufacturer component tests
import * as React from 'react'
import Renderer from 'react-test-renderer'

import FilterManufacturer from '../FilterManufacturer'

describe('FilterManufacturer', () => {
  test('component renders', () => {
    const tree = Renderer.create(<FilterManufacturer />).toJSON()

    expect(tree).toMatchSnapshot()
  })

  // TODO(mc, 2019-03-14): test manufacturer list population
})
