// @flow
// TODO(IL, 2020-03-10): refactor the code covered here to make it more testable, probably by factoring out
// smaller fns from selectStep.
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import { selectStep } from '../actions'
import { PAUSE_UNTIL_RESUME } from '../../../../constants'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import { selectors as uiModulesSelectors } from '../../../modules'
import {
  getNextDefaultPipetteId,
  handleFormChange,
} from '../../../../steplist/formLevel'
import type { FormPatch } from '../../../../steplist/actions'
jest.mock('../../../../step-forms')
jest.mock('../../../modules')
jest.mock('../../../../steplist/formLevel')

const mockGetSavedStepForms: JestMockFn<[any], any> =
  stepFormSelectors.getSavedStepForms
const mockGetOrderedStepIds: JestMockFn<[any], any> =
  stepFormSelectors.getOrderedStepIds
const mockGetInitialDeckSetup: JestMockFn<[any], any> =
  stepFormSelectors.getInitialDeckSetup
const mockGetPipetteEntities: JestMockFn<[any], any> =
  stepFormSelectors.getPipetteEntities
const mockGetLabwareEntities: JestMockFn<[any], any> =
  stepFormSelectors.getLabwareEntities

const mockGetNextDefaultPipetteId: JestMockFn<
  [any, any, any],
  string | null
> = getNextDefaultPipetteId
const mockGetSingleMagneticModuleId: JestMockFn<[any], string | null> =
  uiModulesSelectors.getSingleMagneticModuleId
const mockGetMagnetLabwareEngageHeight: JestMockFn<[any], number | null> =
  uiModulesSelectors.getMagnetLabwareEngageHeight
const mockHandleFormChange: JestMockFn<any, FormPatch> = handleFormChange

beforeEach(() => {
  jest.clearAllMocks()

  mockGetSavedStepForms.mockReturnValue({})
  // NOTE: selectStep doesn't use the results of these selectors directly,
  // it just passes their results into steplist/formLevel fns that we also mock
  mockGetOrderedStepIds.mockReturnValue('getOrderedStepIdsMockReturn')
  mockGetInitialDeckSetup.mockReturnValue('getInitialDeckSetupMockReturn')

  mockGetPipetteEntities.mockReturnValue('pipetteEntityMockReturn')
  mockGetLabwareEntities.mockReturnValue('labwareEntityMockReturn')
  mockGetNextDefaultPipetteId.mockReturnValue(null)
  mockGetSingleMagneticModuleId.mockReturnValue(null)
  mockGetMagnetLabwareEngageHeight.mockReturnValue(null)

  mockHandleFormChange.mockReturnValue({
    handleFormChangePatch: 'mock',
  })
})

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

describe('selectStep', () => {
  describe('selecting previously-saved step', () => {
    it('should restore a saved step', () => {
      const existingStep = {
        stepType: 'pause',
        id: 'existingStepId',
        stepName: 'Example pause',
        stepDetails: 'details',
        pauseAction: PAUSE_UNTIL_RESUME,
      }
      mockGetSavedStepForms.mockReturnValue({ existingStepId: existingStep })
      const store = mockStore({})

      // $FlowFixMe(IL, 2020-03-10): problem dispatching a thunk with mock dispatch
      store.dispatch(selectStep('existingStepId'))

      expect(store.getActions()).toEqual([
        { type: 'SELECT_STEP', payload: 'existingStepId' },
        {
          type: 'POPULATE_FORM',
          payload: existingStep,
        },
      ])
    })
  })
})
