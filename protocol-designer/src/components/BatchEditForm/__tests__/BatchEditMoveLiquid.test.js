// @flow
import React from 'react'
import { shallow } from 'enzyme'
import { PrimaryButton, OutlineButton, Tooltip } from '@opentrons/components'
import { i18n } from '../../../localization'
import { BatchEditMoveLiquid } from '../BatchEditMoveLiquid'

const localizationSpy = jest.spyOn(i18n, 't')

describe('BatchEditMoveLiquid', () => {
  const handleCancel = jest.fn()
  const handleSave = jest.fn()
  let props
  beforeEach(() => {
    // just return the i18n text path itself, instead of the text context at that path
    localizationSpy.mockImplementation(path => path)

    props = {
      batchEditFormHasChanges: true,
      propsForFields: {},
      handleCancel,
      handleSave,
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('save button', () => {
    const saveButtonText = 'button.save' // i18n path

    it('should be enabled when form has changes and have matching tooltip text', () => {
      const tooltipPath = 'tooltip.save_batch_edit.enabled'
      const wrapper = shallow(<BatchEditMoveLiquid {...props} />)

      const saveButton = wrapper
        .find(PrimaryButton)
        .filterWhere(el => el.prop('children') === saveButtonText)

      expect(saveButton.prop('disabled')).toBe(false)

      const saveButtonTooltip = saveButton.parent().dive().find(Tooltip)
      expect(localizationSpy).toHaveBeenCalledWith(tooltipPath)
      expect(saveButtonTooltip.prop('children')).toBe(tooltipPath)

      saveButton.invoke('onClick')()
      expect(handleSave).toHaveBeenCalled()
    })

    it('should be disabled when form has no changes and have matching tooltip text', () => {
      props.batchEditFormHasChanges = false
      const tooltipPath = 'tooltip.save_batch_edit.disabled'
      const wrapper = shallow(<BatchEditMoveLiquid {...props} />)

      const saveButton = wrapper
        .find(PrimaryButton)
        .filterWhere(el => el.prop('children') === saveButtonText)

      expect(saveButton.prop('disabled')).toBe(true)

      const saveButtonTooltip = saveButton.parent().dive().find(Tooltip)
      expect(localizationSpy).toHaveBeenCalledWith(tooltipPath)
      expect(saveButtonTooltip.prop('children')).toBe(tooltipPath)

      // Shallow rendering doesn't honor button disabled attr, see https://github.com/enzymejs/enzyme/issues/386
      // (though that issue criticises `simulate` and says `invoke` is supposed to be a solution...)
      //
      // saveButton.invoke('onClick')()
      // expect(handleSave).not.toHaveBeenCalled()
    })
  })

  describe('cancel button', () => {
    const cancelButtonText = 'button.discard_changes'

    it('should have tooltip', () => {
      const wrapper = shallow(<BatchEditMoveLiquid {...props} />)
      const tooltipPath = 'tooltip.cancel_batch_edit'

      const cancelButton = wrapper
        .find(OutlineButton)
        .filterWhere(el => el.prop('children') === cancelButtonText)

      const cancelButtonTooltip = cancelButton.parent().dive().find(Tooltip)
      expect(localizationSpy).toHaveBeenCalledWith(tooltipPath)
      expect(cancelButtonTooltip.prop('children')).toBe(tooltipPath)
    })

    it('should call handleCancel callback when clicked', () => {
      const wrapper = shallow(<BatchEditMoveLiquid {...props} />)

      const cancelButton = wrapper
        .find(OutlineButton)
        .filterWhere(el => el.prop('children') === cancelButtonText)

      expect(handleCancel).not.toHaveBeenCalled()

      cancelButton.invoke('onClick')()
      expect(handleCancel).toHaveBeenCalled()
    })
  })
})
