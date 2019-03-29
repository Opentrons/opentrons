// @flow
// LabwareList tests
import * as React from 'react'
import Renderer from 'react-test-renderer'

import LabwareList from '../LabwareList'
import {getAllDefinitions} from '../../../definitions'

jest.mock('../../../definitions', () => ({getAllDefinitions: jest.fn()}))

const mockLabware = [
  require('@opentrons/shared-data/definitions2/generic_96_wellplate_380_ul.json'),
  require('@opentrons/shared-data/definitions2/opentrons_96_tiprack_300_ul.json'),
  require('@opentrons/shared-data/definitions2/usa_scientific_12_trough_22_ml.json'),
]

describe('LabwareList', () => {
  beforeAll(() => {
    ;(getAllDefinitions: any).mockReturnValue(mockLabware)
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('component renders', () => {
    const tree = Renderer.create(<LabwareList />).toJSON()

    expect(tree).toMatchSnapshot()
  })

  test('renders a <ul>', () => {
    const tree = Renderer.create(<LabwareList />)

    const items = tree.root.findAllByType('ul')
    expect(items).toHaveLength(1)
  })

  test('renders a <li> per labware definition', () => {
    const tree = Renderer.create(<LabwareList />)

    const items = tree.root.findAllByType('li')
    expect(items).toHaveLength(mockLabware.length)
  })
})
