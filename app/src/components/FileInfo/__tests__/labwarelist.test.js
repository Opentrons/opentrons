// @flow
import * as React from 'react'
import { mount } from 'enzyme'

import {
  ProtocolLabwareList,
  type ProtocolLabwareListProps,
} from '../ProtocolLabwareList'
import { SectionContentFlex } from '../../layout'

describe('Protocol Labware List Component', () => {
  const render = (renderProps: ProtocolLabwareListProps) => {
    return mount(<ProtocolLabwareList {...renderProps} />)
  }

  it('All three sections render, with tool tip', () => {
    const randomTable = (
      <table>
        <tbody>
          <tr>
            <td colSpan="6">Not yet calibrated</td>
          </tr>
        </tbody>
      </table>
    )
    const wrapper = render({
      labware: ['opentrons_labware'],
      quantity: ['x2'],
      calibration: randomTable,
      labwareToParent: { opentrons_labware: '' },
    })
    const sections = wrapper.find(SectionContentFlex)
    const titleList = ['Type', 'Quantity', 'Calibration Data']

    expect(sections.length).toEqual(3)
    sections.forEach(section =>
      expect(titleList).toContain(section.props().title)
    )
  })
})
