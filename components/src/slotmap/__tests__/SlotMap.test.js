// @flow
import { shallow } from 'enzyme'
import * as React from 'react'

import { Icon } from '../../icons'
import { SlotMap } from '../SlotMap'

describe('SlotMap', () => {
  it('component renders 11 slots', () => {
    const wrapper = shallow(<SlotMap occupiedSlots={['1']} />)

    expect(wrapper.find('rect')).toHaveLength(11)
  })

  it('component renders crash info icon when collision slots present', () => {
    const wrapper = shallow(
      <SlotMap occupiedSlots={['1']} collisionSlots={['4']} />
    )

    expect(wrapper.find(Icon)).toHaveLength(1)
  })

  it('component applies occupied and error styles', () => {
    const wrapperDefault = shallow(<SlotMap occupiedSlots={['1']} />)
    const wrapperWithError = shallow(
      <SlotMap occupiedSlots={['1']} isError={true} />
    )

    expect(wrapperDefault.find('.slot_occupied')).toHaveLength(1)
    expect(wrapperWithError.find('.slot_occupied')).toHaveLength(1)
    expect(wrapperWithError.find('.slot_occupied.slot_error')).toHaveLength(1)
  })
})
