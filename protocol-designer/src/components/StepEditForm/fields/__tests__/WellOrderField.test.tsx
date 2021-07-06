import React from 'react'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'
import { WellOrderField, WellOrderFieldProps } from '../WellOrderField'
import {
  WellOrderModal,
  CancelButton,
  ResetButton,
  WellOrderModalProps,
} from '../WellOrderField/WellOrderModal'

describe('WellOrderField', () => {
  const render = (_props: WellOrderFieldProps) =>
    mount(<WellOrderField {..._props} />)

  let props: WellOrderFieldProps
  beforeEach(() => {
    props = {
      prefix: 'aspirate',
      firstValue: null,
      secondValue: null,
      firstName: 'example_wellOrder_first',
      secondName: 'example_wellOrder_second',
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
    it('should NOT update on cancel', () => {
      const wellOrderModalProps: WellOrderModalProps = {
        prefix: 'aspirate',
        closeModal: jest.fn(),
        isOpen: true,
        updateValues: jest.fn(),
        firstValue: 'l2r',
        secondValue: 't2b',
        firstName: 'firstName',
        secondName: 'secondName',
      }
      const wrapper = mount(<WellOrderModal {...wellOrderModalProps} />)
      const wellOrderModal = wrapper.find(WellOrderModal)
      const cancelButton = wellOrderModal.find(CancelButton)
      act(() => {
        cancelButton.prop('onClick')()
      })
      expect(wellOrderModalProps.updateValues).not.toHaveBeenCalled()
    })
    it('should update to default values on reset', () => {
      const wellOrderModalProps: WellOrderModalProps = {
        prefix: 'aspirate',
        closeModal: jest.fn(),
        isOpen: true,
        updateValues: jest.fn(),
        firstValue: 'l2r',
        secondValue: 't2b',
        firstName: 'firstName',
        secondName: 'secondName',
      }
      const wrapper = mount(<WellOrderModal {...wellOrderModalProps} />)
      const wellOrderModal = wrapper.find(WellOrderModal)
      const resetButton = wellOrderModal.find(ResetButton)
      act(() => {
        resetButton.prop('onClick')()
      })
      expect(wellOrderModalProps.updateValues).toHaveBeenCalledWith(
        't2b',
        'l2r'
      )
    })
  })
})
