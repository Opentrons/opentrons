import * as React from 'react'
import { shallow } from 'enzyme'

import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'
import { SlotMap } from '../SlotMap'
import { Icon } from '../../icons'

describe('SlotMap', () => {
  it('component renders 11 slots for ot-2', () => {
    const wrapper = shallow(<SlotMap occupiedSlots={['1']} />)

    expect(wrapper.find('rect')).toHaveLength(11)
  })

  it('component renders crash info icon when collision slots present for ot-2', () => {
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

  it('should render 12 slots for flex', () => {
    const wrapper = shallow(
      <SlotMap occupiedSlots={['D1']} robotType={FLEX_ROBOT_TYPE} />
    )
    expect(wrapper.find('rect')).toHaveLength(11)
  })

  it('component renders crash info icon when collision slots present for flex', () => {
    const wrapper = shallow(
      <SlotMap
        occupiedSlots={['D1']}
        collisionSlots={['D2']}
        robotType={FLEX_ROBOT_TYPE}
      />
    )
    expect(wrapper.find(Icon)).toHaveLength(1)
  })
})
