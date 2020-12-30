// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import UAParser from 'ua-parser-js'
import { mount } from 'enzyme'
import { when, resetAllWhenMocks } from 'jest-when'
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

import { ConnectedStepItem } from '../ConnectedStepItem'
import { StepItem } from '../../components/steplist'

import * as stepFormSelectors from '../../step-forms/selectors/index.js'
import * as dismissSelectors from '../../dismiss/selectors.js'
import * as uiStepSelectors from '../../ui/steps/selectors.js'
import * as fileDataSelectors from '../../file-data/selectors/index.js'
import * as timelineWarningSelectors from '../../top-selectors/timelineWarnings'
import * as featureFlagSelectors from '../../feature-flags/selectors'

jest.mock('ua-parser-js')
jest.mock('../../step-forms/selectors/index.js')
jest.mock('../../file-data/selectors/index.js')
jest.mock('../../top-selectors/timelineWarnings')
jest.mock('../../dismiss/selectors.js')
jest.mock('../../ui/steps/selectors.js')
jest.mock('../../labware-ingred/selectors')
jest.mock('../../feature-flags/selectors')

const getSavedStepFormsMock = stepFormSelectors.getSavedStepForms
const getOrderedStepIdsMock = stepFormSelectors.getOrderedStepIds
const getArgsAndErrorsByStepIdMock = stepFormSelectors.getArgsAndErrorsByStepId
const getCurrentFormIsPresavedMock = stepFormSelectors.getCurrentFormIsPresaved
const getCurrentFormHasUnsavedChangesMock =
  stepFormSelectors.getCurrentFormHasUnsavedChanges
const getHasTimelineWarningsPerStepMock =
  timelineWarningSelectors.getHasTimelineWarningsPerStep
const getHasFormLevelWarningsPerStepMock =
  dismissSelectors.getHasFormLevelWarningsPerStep
const getCollapsedStepsMock = uiStepSelectors.getCollapsedSteps
const getSelectedStepIdMock = uiStepSelectors.getSelectedStepId
const getMultiSelectLastSelectedMock =
  uiStepSelectors.getMultiSelectLastSelected
const getMultiSelectItemIdsMock = uiStepSelectors.getMultiSelectItemIds
const getSubstepsMock = fileDataSelectors.getSubsteps
const getErrorStepId = fileDataSelectors.getErrorStepId
const getBatchEditEnabledMock = featureFlagSelectors.getBatchEditEnabled

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)
const mockId = 'SOMEID'

describe('ConnectedStepItem', () => {
  let store
  beforeEach(() => {
    store = mockStore()

    UAParser.mockImplementation(() => {
      return {
        getOS: () => ({ name: 'Mac OS', version: 'mockVersion' }),
      }
    })

    when(getSavedStepFormsMock)
      .calledWith(expect.anything())
      .mockReturnValue({ [mockId]: 'some form' })

    when(getCurrentFormIsPresavedMock)
      .calledWith(expect.anything())
      .mockReturnValue(false)

    when(getCurrentFormHasUnsavedChangesMock)
      .calledWith(expect.anything())
      .mockReturnValue(false)

    when(getErrorStepId)
      .calledWith(expect.anything())
      .mockReturnValue(false)

    when(getArgsAndErrorsByStepIdMock)
      .calledWith(expect.anything())
      .mockReturnValue({ [mockId]: { errors: undefined } })

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

  const render = props =>
    mount(
      <Provider store={store}>
        <ConnectedStepItem {...props} />
      </Provider>
    )
  describe('when batch edit mode FF is enabled', () => {
    beforeEach(() => {
      when(getBatchEditEnabledMock)
        .calledWith(expect.anything())
        .mockReturnValue(true)
    })

    describe('when clicked normally', () => {
      it('should select a single step when PD not in batch edit mode', () => {
        const props = { stepId: mockId, stepNumber: 1 }
        const mockClickEvent = {
          shiftKey: false,
          metaKey: false,
          ctrlKey: false,
          persist: jest.fn(),
        }
        const wrapper = render(props)

        wrapper.find(StepItem).prop('handleClick')(mockClickEvent)
        const actions = store.getActions()
        const selectStepAction = { type: 'SELECT_STEP', payload: mockId }
        expect(actions[0]).toEqual(selectStepAction)
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
          const mockClickEvent = {
            shiftKey: false,
            metaKey: false,
            ctrlKey: false,
            persist: jest.fn(),
          }
          const wrapper = render(props)
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
          const mockClickEvent = {
            shiftKey: false,
            metaKey: false,
            ctrlKey: false,
            persist: jest.fn(),
          }
          const wrapper = render(props)
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
      const testCases = [
        {
          name: 'should select just one step (in batch edit mode)',
          props: { stepId: mockId, stepNumber: 1 },
          mockClickEvent: {
            shiftKey: true,
            metaKey: false,
            ctrlKey: false,
            persist: jest.fn(),
          },
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
          mockClickEvent: {
            shiftKey: true,
            metaKey: false,
            ctrlKey: false,
            persist: jest.fn(),
          },
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
            'should select a range when the selected step is earlier than the last selected step (single => multi)',
          props: { stepId: mockId, stepNumber: 1 },
          mockClickEvent: {
            shiftKey: true,
            metaKey: false,
            ctrlKey: false,
            persist: jest.fn(),
          },
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
          mockClickEvent: {
            shiftKey: true,
            metaKey: false,
            ctrlKey: false,
            persist: jest.fn(),
          },
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
          mockClickEvent: {
            shiftKey: true,
            metaKey: false,
            ctrlKey: false,
            persist: jest.fn(),
          },
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
          mockClickEvent: {
            shiftKey: true,
            metaKey: false,
            ctrlKey: false,
            persist: jest.fn(),
          },
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
          mockClickEvent: {
            shiftKey: true,
            metaKey: false,
            ctrlKey: false,
            persist: jest.fn(),
          },
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
      ]

      testCases.forEach(
        ({ name, props, mockClickEvent, setupMocks, expectedAction }) => {
          it(name, () => {
            if (setupMocks) {
              setupMocks()
            }
            const wrapper = render(props)
            wrapper.find(StepItem).prop('handleClick')(mockClickEvent)
            const actions = store.getActions()
            expect(actions[0]).toEqual(expectedAction)
          })
        }
      )
    })
    describe('when command + clicked', () => {
      const testCases = [
        {
          name: 'should enter batch edit mode with just step when OS is mac',
          props: { stepId: mockId, stepNumber: 1 },
          mockClickEvent: {
            shiftKey: false,
            metaKey: true,
            ctrlKey: false,
            persist: jest.fn(),
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
            'should enter batch edit mode with just step when OS is not mac',
          props: { stepId: mockId, stepNumber: 1 },
          mockClickEvent: {
            shiftKey: false,
            metaKey: false,
            ctrlKey: true,
            persist: jest.fn(),
          },
          setupMocks: () => {
            UAParser.mockImplementation(() => {
              return {
                getOS: () => ({
                  name: 'Any OS that is not a mac',
                  version: 'mockVersion',
                }),
              }
            })
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
          mockClickEvent: {
            shiftKey: false,
            metaKey: true,
            ctrlKey: false,
            persist: jest.fn(),
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
          mockClickEvent: {
            shiftKey: false,
            metaKey: true,
            ctrlKey: false,
            persist: jest.fn(),
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
        ({ name, props, mockClickEvent, setupMocks, expectedAction }) => {
          it(name, () => {
            setupMocks && setupMocks()
            const wrapper = render(props)
            wrapper.find(StepItem).prop('handleClick')(mockClickEvent)
            const actions = store.getActions()
            expect(actions[0]).toEqual(expectedAction)
          })
        }
      )
    })
  })
})
