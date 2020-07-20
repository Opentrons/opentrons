// @flow
import * as React from 'react'
import { mount } from 'enzyme'

import { Tooltip } from '@opentrons/components'
import { ProtocolLabwareList } from '../ProtocolLabwareList'
import type { LoadNameMapProps } from '../ProtocolLabwareList'

describe('Protocol Labware List Component', () => {
  const render = loadNameMap => {
    return mount(<ProtocolLabwareList loadNameMap={loadNameMap} />)
  }

  it('All three sections render, with tool tip', () => {
    const props: Array<LoadNameMapProps> = [
      {
        parent: '',
        quantity: 2,
        display: 'Opentrons Labware',
        calibration: null,
      },
      {
        parent: 'MODULE GEN1',
        quantity: 2,
        display: 'Other Opentrons Labware',
        calibration: { x: '1', y: '1', z: '1' },
      },
    ]
    const wrapper = render(props)
    const table = wrapper.find('tbody')
    const headers = table.find('th')
    const rows = table.find('tr')
    const calibrationTitle = headers.find('Calibration Data')
    const tooltip = calibrationTitle.find(Tooltip)
    const titleList = ['Type', 'Quantity', 'Calibration Data']

    expect(tooltip.exists()).toEqual(true)
    expect(table.length).toEqual(3)
    headers.forEach(section =>
      expect(titleList).toContain(section.props().children)
    )
    expect(
      rows
        .find('td')
        .at(0)
        .text()
    ).toEqual()
    expect(
      rows
        .find('td')
        .at(1)
        .text()
    ).toEqual()
    expect(
      rows
        .find('td')
        .at(2)
        .text()
    ).toEqual()
  })
})
