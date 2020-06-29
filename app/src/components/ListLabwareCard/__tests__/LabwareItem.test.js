// @flow
import { mount, shallow } from 'enzyme'
import * as React from 'react'

import * as CustomLabware from '../../../custom-labware'
import * as CustomLabwareFixtures from '../../../custom-labware/__fixtures__'
import type {
  InvalidLabwareFile,
  ValidLabwareFile,
} from '../../../custom-labware/types'
import { LabwareItem } from '../LabwareItem'
import { Warning } from '../Warning'

describe('LabwareItem', () => {
  const invalidFile: InvalidLabwareFile = {
    type: CustomLabware.INVALID_LABWARE_FILE,
    filename: 'some_file.json',
    // Oct 21, 2019, 20:00:00 UTC
    created: 1571688000000,
  }

  const validFile: ValidLabwareFile = {
    type: CustomLabware.VALID_LABWARE_FILE,
    filename: 'some_file.json',
    // Oct 21, 2019, 20:00:00 UTC
    created: 1571688000000,
    definition: {
      ...CustomLabwareFixtures.mockDefinition,
      parameters: {
        ...CustomLabwareFixtures.mockDefinition.parameters,
        loadName: 'foo_bar',
      },
      metadata: {
        ...CustomLabwareFixtures.mockDefinition.metadata,
        displayName: 'Foo Bar',
        displayCategory: 'wellPlate',
      },
    },
  }

  it('component renders', () => {
    const treeInvalid = shallow(<LabwareItem file={invalidFile} />)
    const treeValid = shallow(<LabwareItem file={validFile} />)

    expect(treeInvalid).toMatchSnapshot()
    expect(treeValid).toMatchSnapshot()
  })

  it('is a <li>', () => {
    const tree = mount(<LabwareItem file={invalidFile} />)

    expect(tree.getDOMNode().tagName).toBe('LI')
  })

  it('renders props', () => {
    const html = mount(<LabwareItem file={validFile} />).html()

    // file name
    expect(html).toContain('some_file.json')
    // api name
    expect(html).toContain('foo_bar')
    // display name
    expect(html).toContain('Foo Bar')
    // display category
    expect(html).toContain('Well Plate')
    // date added
    expect(html).toContain('2019-10-21')
  })

  it('displays a Warning for invalid files', () => {
    const SPECS = [
      {
        file: CustomLabwareFixtures.mockInvalidLabware,
        expectation: /not a valid Opentrons labware definition/,
      },
      {
        file: CustomLabwareFixtures.mockDuplicateLabware,
        expectation: /conflicts with another labware definition/,
      },
      {
        file: CustomLabwareFixtures.mockOpentronsLabware,
        expectation: /conflicts with an Opentrons standard labware definition/,
      },
    ]

    SPECS.forEach(({ file, expectation }) => {
      const wrapper = mount(<LabwareItem file={file} />)
      expect(wrapper.find(Warning).html()).toMatch(expectation)
    })
  })
})
