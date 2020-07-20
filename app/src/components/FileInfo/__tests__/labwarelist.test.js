// @flow
import * as React from 'react'
import { mount } from 'enzyme'

import {
  ProtocolLabwareList,
  type ProtocolLabwareListProps,
} from '../ProtocolLabwareList'

describe('Protocol Labware List Component', () => {
  const render = ({ loadNameMap }: ProtocolLabwareListProps) => {
    return mount(<ProtocolLabwareList loadNameMap={loadNameMap} />)
  }

  it('All three sections render, with tool tip', () => {
    const randomDiv = <div>Not yet calibrated</div>
    const props = {
      opentrons_labware: {
        parent: '',
        quantity: 'x2',
        display: 'Opentrons Labware',
        calibration: randomDiv,
      },
    }
    const wrapper = render(props)
    const table = wrapper.find('tbody')
    const headers = table.find('th')
    const titleList = ['Type', 'Quantity', 'Calibration Data']

    expect(table.length).toEqual(3)
    headers.forEach(section =>
      expect(titleList).toContain(section.props().children)
    )
  })
})
