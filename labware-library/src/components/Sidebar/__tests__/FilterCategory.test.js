// @flow
// FilterCategory component tests
import * as React from 'react'
import Renderer from 'react-test-renderer'

import FilterCategory from '../FilterCategory'

describe('FilterCategory', () => {
  test('component renders', () => {
    const tree = Renderer.create(<FilterCategory />).toJSON()

    expect(tree).toMatchSnapshot()
  })

  // TODO(mc, 2019-03-14): test category list population
})
