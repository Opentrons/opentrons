// @flow
// LabwareList tests
import * as React from 'react'
import Renderer from 'react-test-renderer'

import LabwareList from '..'
import {getAllDefinitions} from '../../../definitions'

jest.mock('../../../definitions')

const filtersOff = {category: 'all', manufacturer: 'all'}

describe('LabwareList', () => {
  test('component renders', () => {
    const tree = Renderer.create(<LabwareList filters={filtersOff} />).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('renders a <ul>', () => {
    const tree = Renderer.create(<LabwareList filters={filtersOff} />)

    const items = tree.root.findAllByType('ul')
    expect(items).toHaveLength(1)
  })

  test('renders a <li> per labware definition', () => {
    const tree = Renderer.create(<LabwareList filters={filtersOff} />)

    const items = tree.root.findAllByType('li')
    expect(items).toHaveLength(getAllDefinitions().length)
  })
})
