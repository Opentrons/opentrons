// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import { when } from 'jest-when'
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

jest.mock('../../step-forms/selectors/index.js')
jest.mock('../../file-data/selectors/index.js')
jest.mock('../../top-selectors/timelineWarnings')
jest.mock('../../dismiss/selectors.js')
jest.mock('../../ui/steps/selectors.js')
jest.mock('../../labware-ingred/selectors')
jest.mock('../../feature-flags/selectors')

const getSavedStepFormsMock = stepFormSelectors.getSavedStepForms
const getArgsAndErrorsByStepIdMock = stepFormSelectors.getArgsAndErrorsByStepId
const getCurrentFormIsPresavedMock = stepFormSelectors.getCurrentFormIsPresaved
const getCurrentFormHasUnsavedChangesMock =
  stepFormSelectors.getCurrentFormHasUnsavedChanges
const getHasTimelineWarningsPerStepMock =
  timelineWarningSelectors.getHasTimelineWarningsPerStep
const getHasFormLevelWarningsPerStepMock =
  dismissSelectors.getHasFormLevelWarningsPerStep
const getCollapsedStepsMock = uiStepSelectors.getCollapsedSteps
const getMultiSelectItemIdsMock = uiStepSelectors.getMultiSelectItemIds
const getSubstepsMock = fileDataSelectors.getSubsteps
const getBatchEditEnabledMock = featureFlagSelectors.getBatchEditEnabled

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

describe('ConnectedStepItem', () => {
  let store
  let mockId
  beforeEach(() => {
    store = mockStore()
    mockId = 'SOMEID'

    when(getSavedStepFormsMock)
      .calledWith(expect.anything())
      .mockReturnValue({ [mockId]: 'some form' })

    when(getCurrentFormIsPresavedMock)
      .calledWith(expect.anything())
      .mockReturnValue(false)

    when(getCurrentFormHasUnsavedChangesMock)
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
      .mockReturnValue([])

    when(getSubstepsMock)
      .calledWith(expect.anything())
      .mockReturnValue({ [mockId]: undefined })
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  const render = props =>
    mount(
      <Provider store={store}>
        <ConnectedStepItem {...props} />
      </Provider>
    )
  describe('when batch edit mode is on', () => {
    beforeEach(() => {
      when(getBatchEditEnabledMock)
        .calledWith(expect.anything())
        .mockReturnValue(true)
    })
    describe('when clicked normally', () => {
      it('should select a single step', () => {
        const props = { stepId: mockId, stepNumber: 1 }
        const mockClickEvent = {
          shiftKey: false,
          metaKey: false,
        }
        const wrapper = render(props)
        wrapper.find(StepItem).prop('handleClick')(mockClickEvent)
        const actions = store.getActions()
        const selectStepAction = { type: 'SELECT_STEP', payload: 'SOMEID' }
        expect(actions[0]).toEqual(selectStepAction)
      })
    })
    describe('when shift + clicked', () => {
      it('should select a mutiple steps', () => {
        const props = { stepId: mockId, stepNumber: 1 }
        const mockClickEvent = {
          shiftKey: true,
          metaKey: false,
        }
        const wrapper = render(props)
        wrapper.find(StepItem).prop('handleClick')(mockClickEvent)
        const actions = store.getActions()
        const selectMultipleStepsAction = {
          type: 'SELECT_MULTIPLE_STEPS',
          payload: [mockId],
        }
        expect(actions[0]).toEqual(selectMultipleStepsAction)
      })
    })
    describe('when command + clicked', () => {})
  })
})
