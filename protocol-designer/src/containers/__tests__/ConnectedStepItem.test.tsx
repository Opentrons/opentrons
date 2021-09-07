import * as React from 'react'
import { Provider } from 'react-redux'
import { act } from 'react-dom/test-utils'
import UAParser from 'ua-parser-js'
import { mount } from 'enzyme'
import { when, resetAllWhenMocks } from 'jest-when'
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

import { ConnectedStepItem, getMetaSelectedSteps } from '../ConnectedStepItem'
import { StepItem } from '../../components/steplist'
import {
  ConfirmDeleteModal,
  CLOSE_UNSAVED_STEP_FORM,
  CLOSE_STEP_FORM_WITH_CHANGES,
  CLOSE_BATCH_EDIT_FORM,
} from '../../components/modals/ConfirmDeleteModal'

import * as stepFormSelectors from '../../step-forms/selectors/index'
import * as dismissSelectors from '../../dismiss/selectors'
import * as uiStepSelectors from '../../ui/steps/selectors'
import * as fileDataSelectors from '../../file-data/selectors/index'
import * as timelineWarningSelectors from '../../top-selectors/timelineWarnings'

jest.mock('ua-parser-js')
jest.mock('../../step-forms/selectors/index')
jest.mock('../../file-data/selectors/index')
jest.mock('../../top-selectors/timelineWarnings')
jest.mock('../../dismiss/selectors')
jest.mock('../../ui/steps/selectors')
jest.mock('../../labware-ingred/selectors')
jest.mock('../../feature-flags/selectors')

const mockUAParser = UAParser as jest.MockedFunction<typeof UAParser>

const getSavedStepFormsMock = stepFormSelectors.getSavedStepForms as jest.MockedFunction<
  typeof stepFormSelectors.getSavedStepForms
>
const getOrderedStepIdsMock = stepFormSelectors.getOrderedStepIds as jest.MockedFunction<
  typeof stepFormSelectors.getOrderedStepIds
>
const getArgsAndErrorsByStepIdMock = stepFormSelectors.getArgsAndErrorsByStepId as jest.MockedFunction<
  typeof stepFormSelectors.getArgsAndErrorsByStepId
>
const getCurrentFormIsPresavedMock = stepFormSelectors.getCurrentFormIsPresaved as jest.MockedFunction<
  typeof stepFormSelectors.getCurrentFormIsPresaved
>
const getCurrentFormHasUnsavedChangesMock = stepFormSelectors.getCurrentFormHasUnsavedChanges as jest.MockedFunction<
  typeof stepFormSelectors.getCurrentFormHasUnsavedChanges
>
const getBatchEditFormHasUnsavedChangesMock = stepFormSelectors.getBatchEditFormHasUnsavedChanges as jest.MockedFunction<
  typeof stepFormSelectors.getBatchEditFormHasUnsavedChanges
>
const getHasTimelineWarningsPerStepMock = timelineWarningSelectors.getHasTimelineWarningsPerStep as jest.MockedFunction<
  typeof timelineWarningSelectors.getHasTimelineWarningsPerStep
>
const getHasFormLevelWarningsPerStepMock = dismissSelectors.getHasFormLevelWarningsPerStep as jest.MockedFunction<
  typeof dismissSelectors.getHasFormLevelWarningsPerStep
>
const getCollapsedStepsMock = uiStepSelectors.getCollapsedSteps as jest.MockedFunction<
  typeof uiStepSelectors.getCollapsedSteps
>
const getSelectedStepIdMock = uiStepSelectors.getSelectedStepId as jest.MockedFunction<
  typeof uiStepSelectors.getSelectedStepId
>
const getMultiSelectLastSelectedMock = uiStepSelectors.getMultiSelectLastSelected as jest.MockedFunction<
  typeof uiStepSelectors.getMultiSelectLastSelected
>
const getMultiSelectItemIdsMock = uiStepSelectors.getMultiSelectItemIds as jest.MockedFunction<
  typeof uiStepSelectors.getMultiSelectItemIds
>
const getSubstepsMock = fileDataSelectors.getSubsteps as jest.MockedFunction<
  typeof fileDataSelectors.getSubsteps
>
const getErrorStepId = fileDataSelectors.getErrorStepId as jest.MockedFunction<
  typeof fileDataSelectors.getErrorStepId
>
const getIsMultiSelectModeMock = uiStepSelectors.getIsMultiSelectMode as jest.MockedFunction<
  typeof uiStepSelectors.getIsMultiSelectMode
>

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)
const mockId = 'SOMEID'

function createMockClickEvent({
  shiftKey = false,
  metaKey = false,
  ctrlKey = false,
  persist = jest.fn(),
}: {
  shiftKey?: boolean
  metaKey?: boolean
  ctrlKey?: boolean
  persist?: () => void
} = {}): React.MouseEvent {
  return {
    shiftKey,
    metaKey,
    ctrlKey,
    persist,
  } as React.MouseEvent
}

const mockClickEvent = createMockClickEvent()

describe('ConnectedStepItem', () => {
  let store: any
  beforeEach(() => {
    store = mockStore()
    // @ts-expect-error(sa, 2021-6-27): missing parameters from UA Parser constructor return type
    mockUAParser.mockImplementation(() => {
      return {
        getOS: () => ({ name: 'Mac OS', version: 'mockVersion' }),
      }
    })

    when(getSavedStepFormsMock)
      .calledWith(expect.anything())
      // @ts-expect-error(sa, 2021-6-21): 'some form' is not a valid FormData type
      .mockReturnValue({ [mockId]: 'some form' })

    when(getCurrentFormIsPresavedMock)
      .calledWith(expect.anything())
      .mockReturnValue(false)

    when(getCurrentFormHasUnsavedChangesMock)
      .calledWith(expect.anything())
      .mockReturnValue(false)

    when(getIsMultiSelectModeMock)
      .calledWith(expect.anything())
      .mockReturnValue(false)

    when(getErrorStepId)
      .calledWith(expect.anything())
      .mockReturnValue('errorId')

    when(getArgsAndErrorsByStepIdMock)
      .calledWith(expect.anything())
      // @ts-expect-error(sa, 2021-6-21): missing properties
      .mockReturnValue({ [mockId]: { errors: true } })

    when(getHasTimelineWarningsPerStepMock)
      .calledWith(expect.anything())
      .mockReturnValue({})

    when(getHasFormLevelWarningsPerStepMock)
      .calledWith(expect.anything())
      .mockReturnValue({})

    when(getCollapsedStepsMock)
      .calledWith(expect.anything())
      .mockReturnValue({ [mockId]: false })

    when(getMultiSelectItemIdsMock)
      .calledWith(expect.anything())
      .mockReturnValue(null)

    when(getSubstepsMock)
      .calledWith(expect.anything())
      .mockReturnValue({ [mockId]: undefined })
  })
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  const render = (props: any) =>
    mount(
      <Provider store={store}>
        <ConnectedStepItem {...props} />
      </Provider>
    )

  describe('when clicked normally', () => {
    it('should select a single step when PD not in batch edit mode', () => {
      const props = { stepId: mockId, stepNumber: 1 }
      const wrapper = render(props)
      // @ts-expect-error(sa, 2021-6-21): handleClick handler might not exist
      wrapper.find(StepItem).prop('handleClick')(mockClickEvent)
      const actions = store.getActions()
      const selectStepAction = { type: 'SELECT_STEP', payload: mockId }
      expect(actions[0]).toEqual(selectStepAction)
    })

    it('should display the "close unsaved form" modal when form has not yet been saved', () => {
      when(getCurrentFormIsPresavedMock)
        .calledWith(expect.anything())
        .mockReturnValue(true)
      const props = { stepId: mockId, stepNumber: 1 }
      const wrapper = render(props)
      act(() => {
        // @ts-expect-error(sa, 2021-6-21): handleClick handler might not exist
        wrapper.find(StepItem).prop('handleClick')(mockClickEvent)
      })
      wrapper.update()
      const confirmDeleteModal = wrapper.find(ConfirmDeleteModal)
      expect(confirmDeleteModal).toHaveLength(1)
      expect(confirmDeleteModal.prop('modalType')).toBe(CLOSE_UNSAVED_STEP_FORM)
      expect(store.getActions().length).toBe(0)
    })
    it('should display the "unsaved changes to multiple steps" modal when batch edit form has unsaved changes', () => {
      when(getBatchEditFormHasUnsavedChangesMock)
        .calledWith(expect.anything())
        .mockReturnValue(true)

      when(getIsMultiSelectModeMock)
        .calledWith(expect.anything())
        .mockReturnValue(true)
      const props = { stepId: mockId, stepNumber: 1 }
      const wrapper = render(props)
      act(() => {
        // @ts-expect-error(sa, 2021-6-21): handleClick handler might not exist
        wrapper.find(StepItem).prop('handleClick')(mockClickEvent)
      })
      wrapper.update()
      const confirmDeleteModal = wrapper.find(ConfirmDeleteModal)
      expect(confirmDeleteModal).toHaveLength(1)
      expect(confirmDeleteModal.prop('modalType')).toBe(CLOSE_BATCH_EDIT_FORM)
      expect(store.getActions().length).toBe(0)
    })
    it('should display the "unsaved changes to step" modal when single edit form has unsaved changes', () => {
      when(getCurrentFormHasUnsavedChangesMock)
        .calledWith(expect.anything())
        .mockReturnValue(true)
      const props = { stepId: mockId, stepNumber: 1 }
      const wrapper = render(props)
      act(() => {
        // @ts-expect-error(sa, 2021-6-21): handleClick handler might not exist
        wrapper.find(StepItem).prop('handleClick')(mockClickEvent)
      })
      wrapper.update()
      const confirmDeleteModal = wrapper.find(ConfirmDeleteModal)
      expect(confirmDeleteModal).toHaveLength(1)
      expect(confirmDeleteModal.prop('modalType')).toBe(
        CLOSE_STEP_FORM_WITH_CHANGES
      )
      expect(store.getActions().length).toBe(0)
    })
    describe('when PD in batch edit mode', () => {
      it('should select a multiple steps', () => {
        when(getMultiSelectItemIdsMock)
          .calledWith(expect.anything())
          .mockReturnValue(['ANOTHER_ID'])
        when(getOrderedStepIdsMock)
          .calledWith(expect.anything())
          .mockReturnValue(['ANOTHER_ID', mockId])

        const props = { stepId: mockId, stepNumber: 1 }
        const wrapper = render(props)
        // @ts-expect-error(sa, 2021-6-21): handleClick handler might not exist
        wrapper.find(StepItem).prop('handleClick')(mockClickEvent)
        const actions = store.getActions()
        const selectStepAction = {
          type: 'SELECT_MULTIPLE_STEPS',
          payload: {
            stepIds: ['ANOTHER_ID', mockId],
            lastSelected: mockId,
          },
        }
        expect(actions[0]).toEqual(selectStepAction)
      })
      it('should deselect the step', () => {
        when(getMultiSelectItemIdsMock)
          .calledWith(expect.anything())
          .mockReturnValue(['ANOTHER_ID', mockId])
        when(getOrderedStepIdsMock)
          .calledWith(expect.anything())
          .mockReturnValue(['ANOTHER_ID', mockId])

        const props = { stepId: mockId, stepNumber: 1 }
        const wrapper = render(props)
        // @ts-expect-error(sa, 2021-6-21): handleClick handler might not exist
        wrapper.find(StepItem).prop('handleClick')(mockClickEvent)
        const actions = store.getActions()
        const selectStepAction = {
          type: 'SELECT_MULTIPLE_STEPS',
          payload: {
            stepIds: ['ANOTHER_ID'],
            lastSelected: mockId,
          },
        }
        expect(actions[0]).toEqual(selectStepAction)
      })
    })
  })
  describe('when shift + clicked', () => {
    describe('modal prompts', () => {
      it('should display the "close unsaved form" modal when form has not yet been saved', () => {
        when(getCurrentFormIsPresavedMock)
          .calledWith(expect.anything())
          .mockReturnValue(true)
        const props = { stepId: mockId, stepNumber: 1 }
        const clickEvent = {
          ...mockClickEvent,
          shiftKey: true,
        }
        const wrapper = render(props)
        act(() => {
          // @ts-expect-error(sa, 2021-6-21): handleClick handler might not exist
          wrapper.find(StepItem).prop('handleClick')(clickEvent)
        })
        wrapper.update()
        const confirmDeleteModal = wrapper.find(ConfirmDeleteModal)
        expect(confirmDeleteModal).toHaveLength(1)
        expect(confirmDeleteModal.prop('modalType')).toBe(
          CLOSE_UNSAVED_STEP_FORM
        )
        expect(store.getActions().length).toBe(0)
      })

      it('should display the "unsaved changes to step" modal when single edit form has unsaved changes', () => {
        when(getCurrentFormHasUnsavedChangesMock)
          .calledWith(expect.anything())
          .mockReturnValue(true)
        const props = { stepId: mockId, stepNumber: 1 }
        const clickEvent = {
          ...mockClickEvent,
          shiftKey: true,
        }
        const wrapper = render(props)
        act(() => {
          // @ts-expect-error(sa, 2021-6-21): handleClick handler might not exist
          wrapper.find(StepItem).prop('handleClick')(clickEvent)
        })
        wrapper.update()
        const confirmDeleteModal = wrapper.find(ConfirmDeleteModal)
        expect(confirmDeleteModal).toHaveLength(1)
        expect(confirmDeleteModal.prop('modalType')).toBe(
          CLOSE_STEP_FORM_WITH_CHANGES
        )
        expect(store.getActions().length).toBe(0)
      })
    })
    const testCases = [
      {
        name: 'should select just one step (in batch edit mode)',
        props: { stepId: mockId, stepNumber: 1 },
        mockClickEvent: createMockClickEvent({
          shiftKey: true,
          metaKey: false,
          ctrlKey: false,
        }),
        setupMocks: () => {
          when(getOrderedStepIdsMock)
            .calledWith(expect.anything())
            .mockReturnValue([
              'ANOTHER_ID',
              'NOT_SELECTED_ID',
              'YET_ANOTHER_ID',
              mockId,
            ])
        },
        expectedAction: {
          type: 'SELECT_MULTIPLE_STEPS',
          payload: {
            stepIds: [mockId],
            lastSelected: mockId,
          },
        },
      },
      {
        name:
          'should select a range of steps when one step is already selected',
        props: { stepId: mockId, stepNumber: 1 },
        mockClickEvent: createMockClickEvent({
          shiftKey: true,
          metaKey: false,
          ctrlKey: false,
        }),
        setupMocks: () => {
          when(getSelectedStepIdMock)
            .calledWith(expect.anything())
            .mockReturnValue('ANOTHER_ID')
          when(getOrderedStepIdsMock)
            .calledWith(expect.anything())
            .mockReturnValue(['ANOTHER_ID', 'YET_ANOTHER_ID', mockId])
        },
        expectedAction: {
          type: 'SELECT_MULTIPLE_STEPS',
          payload: {
            stepIds: ['ANOTHER_ID', 'YET_ANOTHER_ID', mockId],
            lastSelected: mockId,
          },
        },
      },
      {
        name:
          'should select just one step when the clicked step is already selected',
        props: { stepId: mockId, stepNumber: 1 },
        mockClickEvent: createMockClickEvent({
          shiftKey: true,
          metaKey: false,
          ctrlKey: false,
        }),
        setupMocks: () => {
          when(getSelectedStepIdMock)
            .calledWith(expect.anything())
            .mockReturnValue(mockId)
          when(getOrderedStepIdsMock)
            .calledWith(expect.anything())
            .mockReturnValue(['ANOTHER_ID', 'YET_ANOTHER_ID', mockId])
        },
        expectedAction: {
          type: 'SELECT_MULTIPLE_STEPS',
          payload: {
            stepIds: [mockId],
            lastSelected: mockId,
          },
        },
      },
      {
        name:
          'should select a range when the selected step is earlier than the last selected step (single => multi)',
        props: { stepId: mockId, stepNumber: 1 },
        mockClickEvent: createMockClickEvent({
          shiftKey: true,
          metaKey: false,
          ctrlKey: false,
        }),
        setupMocks: () => {
          when(getOrderedStepIdsMock)
            .calledWith(expect.anything())
            .mockReturnValue([mockId, 'ANOTHER_ID', 'YET_ANOTHER_ID'])
          when(getSelectedStepIdMock)
            .calledWith(expect.anything())
            .mockReturnValue('YET_ANOTHER_ID')
        },
        expectedAction: {
          type: 'SELECT_MULTIPLE_STEPS',
          payload: {
            stepIds: [mockId, 'ANOTHER_ID', 'YET_ANOTHER_ID'],
            lastSelected: mockId,
          },
        },
      },
      {
        name:
          'should select a range when the selected step is earlier than the last selected step (multi => multi)',
        props: { stepId: mockId, stepNumber: 1 },
        mockClickEvent: createMockClickEvent({
          shiftKey: true,
          metaKey: false,
          ctrlKey: false,
        }),
        setupMocks: () => {
          when(getMultiSelectItemIdsMock)
            .calledWith(expect.anything())
            .mockReturnValue(['FOURTH_ID'])
          when(getOrderedStepIdsMock)
            .calledWith(expect.anything())
            .mockReturnValue([mockId, 'SECOND_ID', 'THIRD_ID', 'FOURTH_ID'])
          when(getMultiSelectLastSelectedMock)
            .calledWith(expect.anything())
            .mockReturnValue('FOURTH_ID')
        },
        expectedAction: {
          type: 'SELECT_MULTIPLE_STEPS',
          payload: {
            stepIds: ['FOURTH_ID', mockId, 'SECOND_ID', 'THIRD_ID'],
            lastSelected: mockId,
          },
        },
      },
      {
        name: 'should select a range when some of them are already selected',
        props: { stepId: mockId, stepNumber: 1 },
        mockClickEvent: createMockClickEvent({
          shiftKey: true,
          metaKey: false,
          ctrlKey: false,
        }),
        setupMocks: () => {
          when(getMultiSelectItemIdsMock)
            .calledWith(expect.anything())
            .mockReturnValue(['FIRST_ID', 'SECOND_ID', 'THIRD_ID'])
          when(getOrderedStepIdsMock)
            .calledWith(expect.anything())
            .mockReturnValue(['FIRST_ID', 'SECOND_ID', 'THIRD_ID', mockId])
          when(getMultiSelectLastSelectedMock)
            .calledWith(expect.anything())
            .mockReturnValue('THIRD_ID')
        },
        expectedAction: {
          type: 'SELECT_MULTIPLE_STEPS',
          payload: {
            stepIds: ['FIRST_ID', 'SECOND_ID', 'THIRD_ID', mockId],
            lastSelected: mockId,
          },
        },
      },
      {
        name: 'should deselect a range when all of them are already selected',
        props: { stepId: mockId, stepNumber: 1 },
        mockClickEvent: createMockClickEvent({
          shiftKey: true,
          metaKey: false,
          ctrlKey: false,
        }),
        setupMocks: () => {
          when(getMultiSelectItemIdsMock)
            .calledWith(expect.anything())
            .mockReturnValue([
              'FIRST_ID',
              'ANOTHER_ID',
              'YET_ANOTHER_ID',
              mockId,
            ])
          when(getOrderedStepIdsMock)
            .calledWith(expect.anything())
            .mockReturnValue([
              'FIRST_ID ',
              'ANOTHER_ID',
              'YET_ANOTHER_ID',
              mockId,
            ])
          when(getMultiSelectLastSelectedMock)
            .calledWith(expect.anything())
            .mockReturnValue('ANOTHER_ID')
        },
        expectedAction: {
          type: 'SELECT_MULTIPLE_STEPS',
          payload: {
            stepIds: ['FIRST_ID'],
            lastSelected: mockId,
          },
        },
      },
      {
        name:
          'should deselect a range when all of them are already selected (but preserve the first item and not exit batch edit mode)',
        props: { stepId: mockId, stepNumber: 1 },
        mockClickEvent: createMockClickEvent({
          shiftKey: true,
          metaKey: false,
          ctrlKey: false,
        }),
        setupMocks: () => {
          when(getMultiSelectItemIdsMock)
            .calledWith(expect.anything())
            .mockReturnValue(['YET_ANOTHER_ID', mockId])
          when(getOrderedStepIdsMock)
            .calledWith(expect.anything())
            .mockReturnValue(['ANOTHER_ID', 'YET_ANOTHER_ID', mockId])
          when(getMultiSelectLastSelectedMock)
            .calledWith(expect.anything())
            .mockReturnValue('ANOTHER_ID')
        },
        expectedAction: {
          type: 'SELECT_MULTIPLE_STEPS',
          payload: {
            stepIds: ['ANOTHER_ID'],
            lastSelected: mockId,
          },
        },
      },
      {
        name:
          'should ignore modifier key when clicking step that is already lastSelected',
        props: { stepId: mockId, stepNumber: 1 },
        mockClickEvent: createMockClickEvent({
          shiftKey: true,
          metaKey: false,
          ctrlKey: false,
        }),
        setupMocks: () => {
          when(getMultiSelectItemIdsMock)
            .calledWith(expect.anything())
            .mockReturnValue(['YET_ANOTHER_ID'])
          when(getOrderedStepIdsMock)
            .calledWith(expect.anything())
            .mockReturnValue(['ANOTHER_ID', 'YET_ANOTHER_ID', mockId])
          when(getMultiSelectLastSelectedMock)
            .calledWith(expect.anything())
            .mockReturnValue(mockId)
        },
        expectedAction: {
          type: 'SELECT_MULTIPLE_STEPS',
          payload: {
            stepIds: ['YET_ANOTHER_ID', mockId],
            lastSelected: mockId,
          },
        },
      },
    ]

    testCases.forEach(
      ({ name, props, mockClickEvent, setupMocks, expectedAction }) => {
        it(name, () => {
          if (setupMocks) {
            setupMocks()
          }
          const wrapper = render(props)
          // @ts-expect-error(sa, 2021-6-21): handleClick handler might not exist
          wrapper.find(StepItem).prop('handleClick')(mockClickEvent)
          const actions = store.getActions()
          expect(actions[0]).toEqual(expectedAction)
        })
      }
    )
  })
  describe('when command + clicked', () => {
    describe('modal prompts', () => {
      it('should display the "close unsaved form" modal when form has not yet been saved', () => {
        when(getCurrentFormIsPresavedMock)
          .calledWith(expect.anything())
          .mockReturnValue(true)
        const props = { stepId: mockId, stepNumber: 1 }
        const clickEvent = {
          ...mockClickEvent,
          shiftKey: true,
        }
        const wrapper = render(props)
        act(() => {
          // @ts-expect-error(sa, 2021-6-21): handleClick handler might not exist
          wrapper.find(StepItem).prop('handleClick')(clickEvent)
        })
        wrapper.update()
        const confirmDeleteModal = wrapper.find(ConfirmDeleteModal)
        expect(confirmDeleteModal).toHaveLength(1)
        expect(confirmDeleteModal.prop('modalType')).toBe(
          CLOSE_UNSAVED_STEP_FORM
        )
        expect(store.getActions().length).toBe(0)
      })

      it('should display the "unsaved changes to step" modal when single edit form has unsaved changes', () => {
        when(getCurrentFormHasUnsavedChangesMock)
          .calledWith(expect.anything())
          .mockReturnValue(true)
        const props = { stepId: mockId, stepNumber: 1 }
        const clickEvent = {
          ...mockClickEvent,
          shiftKey: true,
        }
        const wrapper = render(props)
        act(() => {
          // @ts-expect-error(sa, 2021-6-21): handleClick handler might not exist
          wrapper.find(StepItem).prop('handleClick')(clickEvent)
        })
        wrapper.update()
        const confirmDeleteModal = wrapper.find(ConfirmDeleteModal)
        expect(confirmDeleteModal).toHaveLength(1)
        expect(confirmDeleteModal.prop('modalType')).toBe(
          CLOSE_STEP_FORM_WITH_CHANGES
        )
        expect(store.getActions().length).toBe(0)
      })
    })
    describe('on non mac OS', () => {
      it('should select a single step', () => {
        const props = {
          stepId: mockId,
          stepNumber: 1,
        }
        const clickEvent = {
          ...mockClickEvent,
          metaKey: true,
        }
        // @ts-expect-error(sa, 2021-6-27): missing parameters from UA Parser constructor return type
        mockUAParser.mockImplementation(() => {
          return {
            getOS: () => ({ name: 'NOT Mac OS', version: 'mockVersion' }),
          }
        })

        const wrapper = render(props)
        // @ts-expect-error(sa, 2021-6-21): handleClick handler might not exist
        wrapper.find(StepItem).prop('handleClick')(clickEvent)
        const actions = store.getActions()
        expect(actions[0]).toEqual({ payload: 'SOMEID', type: 'SELECT_STEP' })
      })
    })
    describe('on mac OS', () => {
      const testCases = [
        {
          name: 'should enter batch edit mode with just step',
          props: { stepId: mockId, stepNumber: 1 },
          clickEvent: {
            ...mockClickEvent,
            metaKey: true,
          },
          setupMocks: null,
          expectedAction: {
            type: 'SELECT_MULTIPLE_STEPS',
            payload: {
              stepIds: [mockId],
              lastSelected: mockId,
            },
          },
        },
        {
          name:
            'should enter batch edit mode with just step (when clicking the same step that is already selected)',
          props: { stepId: mockId, stepNumber: 1 },
          clickEvent: {
            ...mockClickEvent,
            metaKey: true,
          },
          setupMocks: () => {
            when(getSelectedStepIdMock)
              .calledWith(expect.anything())
              .mockReturnValue(mockId)
          },
          expectedAction: {
            type: 'SELECT_MULTIPLE_STEPS',
            payload: {
              stepIds: [mockId],
              lastSelected: mockId,
            },
          },
        },
        {
          name: 'should enter batch edit mode with multiple steps',
          props: { stepId: mockId, stepNumber: 1 },
          clickEvent: {
            ...mockClickEvent,
            metaKey: true,
          },
          setupMocks: () => {
            when(getMultiSelectItemIdsMock)
              .calledWith(expect.anything())
              .mockReturnValue(['ANOTHER_ID'])
          },
          expectedAction: {
            type: 'SELECT_MULTIPLE_STEPS',
            payload: {
              stepIds: ['ANOTHER_ID', mockId],
              lastSelected: mockId,
            },
          },
        },
        {
          name:
            'should do nothing if deselecting the step item results in 0 steps being selected',
          props: { stepId: mockId, stepNumber: 1 },
          clickEvent: {
            ...mockClickEvent,
            metaKey: true,
          },
          setupMocks: () => {
            when(getMultiSelectItemIdsMock)
              .calledWith(expect.anything())
              .mockReturnValue([mockId])
          },
          expectedAction: undefined, // no action should be dispatched
        },
      ]

      testCases.forEach(
        ({ name, props, clickEvent, setupMocks, expectedAction }) => {
          it(name, () => {
            setupMocks && setupMocks()
            // @ts-expect-error(sa, 2021-6-27): missing parameters from UA Parser constructor return type
            mockUAParser.mockImplementation(() => {
              return {
                getOS: () => ({
                  name: 'Mac OS',
                  version: 'mockVersion',
                }),
              }
            })
            const wrapper = render(props)
            // @ts-expect-error(sa, 2021-6-21): handleClick handler might not exist
            wrapper.find(StepItem).prop('handleClick')(clickEvent)
            const actions = store.getActions()
            expect(actions[0]).toEqual(expectedAction)
          })
        }
      )
    })
  })
  describe('when ctrl + clicked', () => {
    describe('on mac OS', () => {
      it('should select a single step', () => {
        const props = {
          stepId: mockId,
          stepNumber: 1,
        }
        const clickEvent = {
          ...mockClickEvent,
          ctrlKey: true,
        }
        // @ts-expect-error(sa, 2021-6-27): missing parameters from UA Parser constructor return type
        mockUAParser.mockImplementation(() => {
          return {
            getOS: () => ({ name: 'Mac OS', version: 'mockVersion' }),
          }
        })

        const wrapper = render(props)
        // @ts-expect-error(sa, 2021-6-21): handleClick handler might not exist
        wrapper.find(StepItem).prop('handleClick')(clickEvent)
        const actions = store.getActions()
        expect(actions[0]).toEqual({ payload: 'SOMEID', type: 'SELECT_STEP' })
      })
    })
    describe('on non mac OS', () => {
      const testCases = [
        {
          name: 'should enter batch edit mode with just step',
          props: { stepId: mockId, stepNumber: 1 },
          clickEvent: {
            ...mockClickEvent,
            ctrlKey: true,
          },
          setupMocks: null,
          expectedAction: {
            type: 'SELECT_MULTIPLE_STEPS',
            payload: {
              stepIds: [mockId],
              lastSelected: mockId,
            },
          },
        },
        {
          name: 'should enter batch edit mode with multiple steps',
          props: { stepId: mockId, stepNumber: 1 },
          clickEvent: {
            ...mockClickEvent,
            ctrlKey: true,
          },
          setupMocks: () => {
            when(getMultiSelectItemIdsMock)
              .calledWith(expect.anything())
              .mockReturnValue(['ANOTHER_ID'])
          },
          expectedAction: {
            type: 'SELECT_MULTIPLE_STEPS',
            payload: {
              stepIds: ['ANOTHER_ID', mockId],
              lastSelected: mockId,
            },
          },
        },
        {
          name:
            'should do nothing if deselecting the step item results in 0 steps being selected',
          props: { stepId: mockId, stepNumber: 1 },
          clickEvent: {
            ...mockClickEvent,
            ctrlKey: true,
          },
          setupMocks: () => {
            when(getMultiSelectItemIdsMock)
              .calledWith(expect.anything())
              .mockReturnValue([mockId])
          },
          expectedAction: undefined, // no action should be dispatched
        },
      ]

      testCases.forEach(
        ({ name, props, clickEvent, setupMocks, expectedAction }) => {
          it(name, () => {
            setupMocks && setupMocks()
            // @ts-expect-error(sa, 2021-6-27): missing parameters from UA Parser constructor return type
            mockUAParser.mockImplementation(() => {
              return {
                getOS: () => ({
                  name: 'NOT Mac OS',
                  version: 'mockVersion',
                }),
              }
            })
            const wrapper = render(props)
            // @ts-expect-error(sa, 2021-6-21): handleClick handler might not exist
            wrapper.find(StepItem).prop('handleClick')(clickEvent)
            const actions = store.getActions()
            expect(actions[0]).toEqual(expectedAction)
          })
        }
      )
    })
  })
})

describe('getMetaSelectedSteps', () => {
  describe('when already in multi select mode', () => {
    it('should return the new steps and the original selected step', () => {
      const multiSelectItemIds = ['1', '2']
      const stepId = '3'
      const singleSelectedId = null
      expect(
        getMetaSelectedSteps(multiSelectItemIds, stepId, singleSelectedId)
      ).toEqual(['1', '2', '3'])
    })
    it('should remove the step if its already been selected', () => {
      const multiSelectItemIds = ['1', '2']
      const stepId = '2'
      const singleSelectedId = null
      expect(
        getMetaSelectedSteps(multiSelectItemIds, stepId, singleSelectedId)
      ).toEqual(['1'])
    })
  })
  describe('when one step is selected (in single edit mode)', () => {
    it('should return the original step and the new step', () => {
      const multiSelectItemIds = null
      const stepId = '2'
      const singleSelectedId = '1'
      expect(
        getMetaSelectedSteps(multiSelectItemIds, stepId, singleSelectedId)
      ).toEqual(['1', '2'])
    })
    it('should only return the original step once when it is the same as the selected step id', () => {
      const multiSelectItemIds = null
      const stepId = '2'
      const singleSelectedId = '2'
      expect(
        getMetaSelectedSteps(multiSelectItemIds, stepId, singleSelectedId)
      ).toEqual(['2'])
    })
  })
  describe('when no steps are selected', () => {
    it('should return the given step id', () => {
      const multiSelectItemIds = null
      const stepId = '2'
      const singleSelectedId = null
      expect(
        getMetaSelectedSteps(multiSelectItemIds, stepId, singleSelectedId)
      ).toEqual(['2'])
    })
  })
})
