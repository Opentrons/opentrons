// @flow
// LabwareGuide component tests
import * as React from 'react'
import Renderer from 'react-test-renderer'

import LabwareGuide from '../LabwareGuide'

describe('LabwareGuide', () => {
  test('component renders', () => {
    const tree = Renderer.create(<LabwareGuide />).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
