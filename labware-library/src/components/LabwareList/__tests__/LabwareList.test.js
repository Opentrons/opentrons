// @flow
// LabwareList tests
import * as React from 'react'
import {shallow} from 'enzyme'

import LabwareList from '..'
import LabwareCard from '../LabwareCard'
import {getAllDefinitions} from '../../../definitions'

jest.mock('../../../definitions')

const filtersOff = {category: 'all', manufacturer: 'all'}

describe('LabwareList', () => {
  test('component renders', () => {
    const tree = shallow(<LabwareList filters={filtersOff} />)

    expect(tree).toMatchSnapshot()
  })

  test('renders a <ul>', () => {
    const tree = shallow(<LabwareList filters={filtersOff} />)

    expect(tree.find('ul')).toHaveLength(1)
  })

  test('renders a LabwareCard per labware definition', () => {
    const tree = shallow(<LabwareList filters={filtersOff} />)

    expect(tree.find(LabwareCard)).toHaveLength(getAllDefinitions().length)
  })
})
