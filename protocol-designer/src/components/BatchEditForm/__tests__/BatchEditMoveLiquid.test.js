// @flow
import React from 'react'
import { shallow } from 'enzyme'
import { act } from 'react-dom/test-utils'
import { PrimaryButton, Tooltip } from '@opentrons/components'
import { i18n } from '../../../localization'
import { BatchEditMoveLiquid } from '../'

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

  const saveButtonText = 'button.save' // i18n path

  it('save should be enabled when form has changes', () => {
    const tooltipPath = 'tooltip.save_batch_edit.enabled'
    const wrapper = shallow(<BatchEditMoveLiquid {...props} />)

    const saveButton = wrapper
      .find(PrimaryButton)
      .filterWhere(el => el.prop('children') === saveButtonText)

    expect(saveButton.prop('disabled')).toBe(false)

    const saveButtonTooltip = saveButton.parent().dive().find(Tooltip)
    expect(localizationSpy).toHaveBeenCalledWith(tooltipPath)
    expect(saveButtonTooltip.prop('children')).toBe(tooltipPath)

    act(() => {
      saveButton.simulate('click')
    })
    expect(handleSave).toHaveBeenCalled()
  })

  it('save should be disabled when form has no changes', () => {
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

    // TODO(IL, 2021-03-01): why is handleSave being called here but IRL it will not be??
    // expect(handleSave).not.toHaveBeenCalled()
    // act(() => {
    //   saveButton.simulate('click')
    // })
    // expect(handleSave).not.toHaveBeenCalled()
  })

  it('clicking cancel button should call handleCancel callback', () => {
    const wrapper = shallow(<BatchEditMoveLiquid {...props} />)

    const cancelButtonText = 'button.cancel'

    const cancelButton = wrapper
      .find(PrimaryButton)
      .filterWhere(el => el.prop('children') === cancelButtonText)

    expect(handleCancel).not.toHaveBeenCalled()
    act(() => {
      cancelButton.simulate('click')
    })
    expect(handleCancel).toHaveBeenCalled()
  })
})
