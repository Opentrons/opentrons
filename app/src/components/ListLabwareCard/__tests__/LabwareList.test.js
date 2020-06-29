// @flow
import { mount, shallow } from 'enzyme'
import * as React from 'react'

import * as Fixtures from '../../../custom-labware/__fixtures__'
import { LabwareItem } from '../LabwareItem'
import { LabwareList } from '../LabwareList'

describe('LabwareList', () => {
  const emptyProps = { labware: [], errorMessage: null }
  const errorProps = { labware: [], errorMessage: 'AH!!!' }
  const listProps = {
    labware: [
      Fixtures.mockValidLabware,
      Fixtures.mockInvalidLabware,
      Fixtures.mockOpentronsLabware,
      Fixtures.mockDuplicateLabware,
    ],
    errorMessage: null,
  }

  it('component renders', () => {
    const treeEmpty = shallow(<LabwareList {...emptyProps} />)
    const treeError = shallow(<LabwareList {...errorProps} />)
    const treeList = shallow(<LabwareList {...listProps} />)

    expect(treeEmpty).toMatchSnapshot()
    expect(treeError).toMatchSnapshot()
    expect(treeList).toMatchSnapshot()
  })

  it('renders empty list copy without a <ul> if no labware', () => {
    const tree = mount(<LabwareList {...emptyProps} />)

    expect(tree.find('ul')).toHaveLength(0)
    expect(tree.html()).toMatch(/No labware definitions found/)
  })

  it('renders error message without a <ul> if error message', () => {
    const tree = mount(<LabwareList {...errorProps} />)

    expect(tree.find('ul')).toHaveLength(0)
    expect(tree.html()).toMatch(/Unable to read/)
    expect(tree.html()).toContain('AH!!!')
  })

  it('renders labware children in a <ul>', () => {
    const tree = shallow(<LabwareList {...listProps} />)
    const list = tree.find('ul')
    const items = tree.find(LabwareItem)

    expect(list).toHaveLength(1)
    expect(items).toHaveLength(listProps.labware.length)
  })
})
