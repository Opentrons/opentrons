// @flow
import React from 'react'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'
import { WellOrderField } from '../WellOrderField'
import { WellOrderModal } from '../WellOrderField/WellOrderModal'

describe('WellOrderField', () => {
  const render = _props => mount(<WellOrderField {..._props} />)

  let props
  beforeEach(() => {
    props = {
      prefix: 'aspirate',
      formData: ({}: any),
      updateFirstWellOrder: jest.fn(),
      updateSecondWellOrder: jest.fn(),
    }
  })

  describe('WellOrderModal', () => {
    it('should call correct updater fns passed in', () => {
      const wrapper = render(props)
      const wellOrderModal = wrapper.find(WellOrderModal)
      act(() => {
        wellOrderModal.prop('updateValues')('l2r', 't2b')
      })
      expect(props.updateFirstWellOrder).toHaveBeenCalledWith('l2r')
      expect(props.updateSecondWellOrder).toHaveBeenCalledWith('t2b')
    })
  })
})
