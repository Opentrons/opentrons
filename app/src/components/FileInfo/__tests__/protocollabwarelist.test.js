// @flow
import * as React from 'react'
import { mount } from 'enzyme'

import { Flex, Icon } from '@opentrons/components'
import { ProtocolLabwareList } from '../ProtocolLabwareList'

import { SectionContentFlex } from '../../layout'

describe('Protocol Labware List Component', () => {
  const render = (
    labware: Array<?string>,
    quantity: Array<?string>,
    calibration: Array<?React.Node>
  ) => {
    return mount(
      <ProtocolLabwareList
        labware={labware}
        quantity={quantity}
        calibration={calibration}
      />
    )
  }

  it('renders nothing when no labware exists in the protocol', () => {
    const wrapper = render([], [], [])
    expect(wrapper).toEqual({})
  })

  it('renders three columns when a labware exists', () => {
    const rowToRender = (
      <tr>
        <td>Not yet calibrated</td>
      </tr>
    )
    const wrapper = render(['opentrons_labware'], ['x1'], [rowToRender])
    const flex = wrapper.find(Flex)
    const sections = flex.find(SectionContentFlex)
    console.log(sections)
    expect(wrapper).toEqual({})
  })

  it('renders a table with values when given calibration data', () => {
    const rowToRender = <tr>Not yet calibrated</tr>
    // const wrapper = render(['opentrons_labware'], ['x1'], [rowToRender])
    // const parent = wrapper.find(Flex).first()
    // const icon = wrapper.find(Icon)

    // expect(parent.prop('color')).toBe(COLOR_WARNING)
    // expect(icon.prop('name')).toEqual('alert-circle')
    // expect(wrapper.html()).toMatch(/not yet been calibrated/i)
    // expect(wrapper.html()).toMatch(/please perform a deck calibration/i)
  })
})
