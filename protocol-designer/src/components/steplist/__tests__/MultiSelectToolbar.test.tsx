import React from 'react'
import { Provider } from 'react-redux'
import thunk from 'redux-thunk'
import { mount } from 'enzyme'
import configureMockStore from 'redux-mock-store'
import { when, resetAllWhenMocks } from 'jest-when'
import { act } from 'react-dom/test-utils'

import { actions as stepActions } from '../../../ui/steps'
import * as stepFormSelectors from '../../../step-forms/selectors'
import * as stepSelectors from '../../../ui/steps/selectors'
import * as stepListActions from '../../../steplist/actions/actions'

import {
  MultiSelectToolbar,
  ClickableIcon,
  Accordion,
} from '../MultiSelectToolbar'
import {
  ConfirmDeleteModal,
  CLOSE_BATCH_EDIT_FORM,
  DELETE_MULTIPLE_STEP_FORMS,
} from '../../modals/ConfirmDeleteModal'

jest.mock('../../../step-forms/selectors')
jest.mock('../../../ui/steps/selectors')

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)
const getOrderedStepIdsMock = stepFormSelectors.getOrderedStepIds
const getMultiSelectItemIdsMock = stepSelectors.getMultiSelectItemIds
const getBatchEditFormHasUnsavedChangesMock =
  stepFormSelectors.getBatchEditFormHasUnsavedChanges

describe('MultiSelectToolbar', () => {
  let store: any
  let props: React.ComponentProps<typeof MultiSelectToolbar>
  beforeEach(() => {
    store = mockStore()
    props = {
      isMultiSelectMode: true,
    }
    when(getOrderedStepIdsMock)
      .calledWith(expect.anything())
      .mockReturnValue([])

    when(getMultiSelectItemIdsMock)
      .calledWith(expect.anything())
      .mockReturnValue([])

    when(getBatchEditFormHasUnsavedChangesMock)
      .calledWith(expect.anything())
      .mockReturnValue(false)
  })

  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
  })
  const render = () =>
    mount(
      <Provider store={store}>
        <MultiSelectToolbar {...props} />
      </Provider>
    )

  it('should collapse the toolbar when isMultiSelectMode is FALSE', () => {
    props.isMultiSelectMode = false
    const wrapper = render()
    const accordion = wrapper.find(Accordion)
    expect(accordion.prop('expanded')).toBe(false)
  })

  it('should expand the toolbar when isMultiSelectMode is TRUE', () => {
    props.isMultiSelectMode = true
    const wrapper = render()
    const accordion = wrapper.find(Accordion)
    expect(accordion.prop('expanded')).toBe(true)
  })

  it('should render the delete, copy, and exapand icons with the correct tooltips', () => {
    const wrapper = render()
    const icons = wrapper.find(ClickableIcon)
    const deleteIcon = icons.at(1)
    const copyIcon = icons.at(2)
    const expandIcon = icons.at(3)

    expect(deleteIcon.prop('iconName')).toBe('delete')
    expect(deleteIcon.prop('tooltipText')).toBe('Delete')

    expect(copyIcon.prop('iconName')).toBe('content-copy')
    expect(copyIcon.prop('tooltipText')).toBe('Duplicate')

    expect(expandIcon.prop('iconName')).toBe('unfold-more-horizontal')
    expect(expandIcon.prop('tooltipText')).toBe('Expand')
  })
  it('should have a checked checkbox when all steps are selected, and deselect them all when clicked', () => {
    when(getOrderedStepIdsMock)
      .calledWith(expect.anything())
      .mockReturnValue(['id_1', 'id_2'])

    when(getMultiSelectItemIdsMock)
      .calledWith(expect.anything())
      .mockReturnValue(['id_1', 'id_2'])

    const deselectAllStepsSpy = jest
      .spyOn(stepActions, 'deselectAllSteps')
      .mockImplementation(() => () => null) // mockImplementation is just to avoid calling the real action creator

    const wrapper = render()
    const selectIcon = wrapper.find(ClickableIcon).first()
    expect(selectIcon.prop('iconName')).toBe('checkbox-marked')
    expect(selectIcon.prop('tooltipText')).toBe('Deselect All')
    act(() => {
      selectIcon.prop('onClick')?.({} as React.MouseEvent)
    })
    expect(deselectAllStepsSpy).toHaveBeenCalled()
  })

  it('should have a minus box when not all steps are selected, and select them all when clicked', () => {
    when(getOrderedStepIdsMock)
      .calledWith(expect.anything())
      .mockReturnValue(['id_1', 'id_2'])

    when(getMultiSelectItemIdsMock)
      .calledWith(expect.anything())
      .mockReturnValue(['id_1'])

    const selectAllStepsSpy = jest.spyOn(stepActions, 'selectAllSteps')
    const wrapper = render()
    const selectIcon = wrapper.find(ClickableIcon).first()
    expect(selectIcon.prop('iconName')).toBe('minus-box')
    expect(selectIcon.prop('tooltipText')).toBe('Select All')
    act(() => {
      selectIcon.prop('onClick')?.({} as React.MouseEvent)
    })
    expect(selectAllStepsSpy).toHaveBeenCalled()
  })
  describe('when clicking on expand/collapse', () => {
    afterEach(() => {
      jest.restoreAllMocks()
    })
    it('should expand/collapse the selected steps', () => {
      when(getMultiSelectItemIdsMock)
        .calledWith(expect.anything())
        .mockReturnValue(['id_1', 'id_2'])

      const expandMultipleStepsSpy = jest.spyOn(
        stepActions,
        'expandMultipleSteps'
      )

      const wrapper = render()
      const expandIcon = wrapper.find(ClickableIcon).at(3)
      act(() => {
        expandIcon.prop('onClick')?.({} as React.MouseEvent)
      })
      expect(expandMultipleStepsSpy).toHaveBeenCalledWith(['id_1', 'id_2'])

      wrapper.update()

      const collapseMultipleStepsSpy = jest.spyOn(
        stepActions,
        'collapseMultipleSteps'
      )

      const collapseIcon = wrapper.find(ClickableIcon).at(3)

      act(() => {
        collapseIcon.prop('onClick')?.({} as React.MouseEvent)
      })
      expect(collapseMultipleStepsSpy).toHaveBeenCalledWith(['id_1', 'id_2'])
    })
    it('should toggle the expand/collapse icon', () => {
      const wrapper = render()
      const expandIcon = wrapper.find(ClickableIcon).at(3)
      expect(expandIcon.prop('iconName')).toBe('unfold-more-horizontal')
      expect(expandIcon.prop('tooltipText')).toBe('Expand')
      act(() => {
        expandIcon.prop('onClick')?.({} as React.MouseEvent)
      })
      wrapper.update()
      const expandIconUpdated = wrapper.find(ClickableIcon).at(3)
      expect(expandIconUpdated.prop('iconName')).toBe('unfold-less-horizontal')
      expect(expandIconUpdated.prop('tooltipText')).toBe('Collapse')
    })
  })
  describe('when clicking on delete', () => {
    it('should show a confirm delete modal before deleting the steps', () => {
      when(getOrderedStepIdsMock)
        .calledWith(expect.anything())
        .mockReturnValue(['id_1', 'id_2'])

      when(getMultiSelectItemIdsMock)
        .calledWith(expect.anything())
        .mockReturnValue(['id_1'])

      const deleteMultipleStepsSpy = jest.spyOn(
        stepListActions,
        'deleteMultipleSteps'
      )

      const wrapper = render()
      const deleteIcon = wrapper.find(ClickableIcon).at(1)

      act(() => {
        deleteIcon.prop('onClick')?.({} as React.MouseEvent)
      })

      wrapper.update()
      const confirmDeleteModal = wrapper.find(ConfirmDeleteModal)
      expect(deleteMultipleStepsSpy).not.toHaveBeenCalled()
      expect(confirmDeleteModal.prop('modalType')).toBe(
        DELETE_MULTIPLE_STEP_FORMS
      )

      act(() => {
        // @ts-expect-error(sa, 2021-6-27): not sure why TS not recognizing onContinueClick overload with no event parameter
        confirmDeleteModal.prop('onContinueClick')()
      })
      wrapper.update()

      expect(wrapper.find(ConfirmDeleteModal).length).toBe(0)
      expect(deleteMultipleStepsSpy).toHaveBeenCalledWith(['id_1'])
    })
  })
  describe('when clicking on duplicate', () => {
    it('should duplicate all of the steps selected when there are NO changes to the batch edit form', () => {
      when(getOrderedStepIdsMock)
        .calledWith(expect.anything())
        .mockReturnValue(['id_1', 'id_2'])

      when(getMultiSelectItemIdsMock)
        .calledWith(expect.anything())
        .mockReturnValue(['id_1'])

      const duplicateMultipleStepsSpy = jest.spyOn(
        stepActions,
        'duplicateMultipleSteps'
      )

      const wrapper = render()

      const copyIcon = wrapper.find(ClickableIcon).at(2)
      act(() => {
        copyIcon.prop('onClick')?.({} as React.MouseEvent)
      })

      expect(duplicateMultipleStepsSpy).toHaveBeenCalledWith(['id_1'])
    })

    it('should show a confirm delete modal when there are changes to the batch edit form', () => {
      when(getBatchEditFormHasUnsavedChangesMock)
        .calledWith(expect.anything())
        .mockReturnValue(true)

      when(getOrderedStepIdsMock)
        .calledWith(expect.anything())
        .mockReturnValue(['id_1', 'id_2'])

      when(getMultiSelectItemIdsMock)
        .calledWith(expect.anything())
        .mockReturnValue(['id_1'])

      const duplicateMultipleStepsSpy = jest.spyOn(
        stepActions,
        'duplicateMultipleSteps'
      )

      const wrapper = render()
      const copyIcon = wrapper.find(ClickableIcon).at(2)

      act(() => {
        copyIcon.prop('onClick')?.({} as React.MouseEvent)
      })

      wrapper.update()
      const confirmDeleteModal = wrapper.find(ConfirmDeleteModal)
      expect(duplicateMultipleStepsSpy).not.toHaveBeenCalled()
      expect(confirmDeleteModal.prop('modalType')).toBe(CLOSE_BATCH_EDIT_FORM)

      act(() => {
        // @ts-expect-error(sa, 2021-6-27): not sure why TS not recognizing onContinueClick overload with no event parameter
        confirmDeleteModal.prop('onContinueClick')()
      })
      wrapper.update()

      expect(wrapper.find(ConfirmDeleteModal).length).toBe(0)
      expect(duplicateMultipleStepsSpy).toHaveBeenCalledWith(['id_1'])
    })
  })
})
