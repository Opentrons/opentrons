// @flow
import * as React from 'react'
import { mount } from 'enzyme'

import { Icon, Tooltip, Text } from '@opentrons/components'
import { ProtocolLabwareList } from '../ProtocolLabwareList'

const LABWARE = [
  {
    displayName: 'Opentrons Labware',
    parentDisplayName: null,
    quantity: 2,
    calibration: null,
    legacy: false,
  },
  {
    displayName: 'Other Opentrons Labware',
    parentDisplayName: 'MODULE GEN1',
    quantity: 1,
    calibration: { x: 1.2, y: 3, z: 4.5 },
    legacy: false,
  },
  {
    displayName: 'V1 Labware',
    parentDisplayName: null,
    quantity: 3,
    calibration: null,
    legacy: true,
  },
]

describe('ProtocolLabwareList Component', () => {
  const render = () => {
    return mount(<ProtocolLabwareList labware={LABWARE} />)
  }

  it('renders a list with one item per labware', () => {
    const wrapper = render()
    const list = wrapper.find('ul')
    const items = list.find('li')
    expect(items).toHaveLength(LABWARE.length)
  })

  it('renders a "table header"', () => {
    const wrapper = render()
    // cast Tooltip to any so we can use it in the matcher below without props
    const Tt: any = Tooltip

    /* eslint-disable react/jsx-key */
    expect(
      wrapper.containsAllMatchingElements([
        <Text>Type</Text>,
        <Text>Quantity</Text>,
        <Text>Calibration Data</Text>,
        <Icon name="information" />,
        <Tt>Calibrated offset from labware origin point</Tt>,
      ])
    ).toBe(true)
    /* eslint-enable react/jsx-key */
  })

  it('renders labware props', () => {
    const wrapper = render()

    const item0 = wrapper.find('li').at(0)
    const item1 = wrapper.find('li').at(1)
    const item2 = wrapper.find('li').at(2)

    /* eslint-disable react/jsx-key */
    expect(
      item0.containsAllMatchingElements([
        <Text>Opentrons Labware</Text>,
        <Text>x 2</Text>,
        <Text>Not yet calibrated</Text>,
      ])
    ).toBe(true)

    expect(
      item1.containsAllMatchingElements([
        <Text>MODULE GEN1</Text>,
        <Text>Other Opentrons Labware</Text>,
        <Text>x 1</Text>,
        <span>X</span>,
        <span>1.2</span>,
        <span>Y</span>,
        <span>3.0</span>,
        <span>Z</span>,
        <span>4.5</span>,
      ])
    ).toBe(true)

    expect(
      item2.containsAllMatchingElements([
        <Text>V1 Labware</Text>,
        <Text>x 3</Text>,
        <Text>Legacy definition</Text>,
      ])
    ).toBe(true)
    /* eslint-enable react/jsx-key */
  })
})
