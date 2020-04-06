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
  getNextDefaultMagnetAction,
  getNextDefaultTemperatureModuleId,
  getNextDefaultPipetteId,
  handleFormChange,
} from '../../../../steplist/formLevel'
import type { FormPatch } from '../../../../steplist/actions'
import type { FormData, MagnetAction } from '../../../../form-types'
jest.mock('../../../../step-forms')
jest.mock('../../../modules')
jest.mock('../../../../steplist/formLevel')

const mock_getStepFormData: JestMockFn<[any, string, string], ?FormData> =
  stepFormSelectors._getStepFormData
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
const mockGetNextDefaultTemperatureModuleId: JestMockFn<
  [any, any, any],
  string | null
> = getNextDefaultTemperatureModuleId
const mockGetSingleMagneticModuleId: JestMockFn<[any], string | null> =
  uiModulesSelectors.getSingleMagneticModuleId
const mockGetMagnetLabwareEngageHeight: JestMockFn<[any], number | null> =
  uiModulesSelectors.getMagnetLabwareEngageHeight
const mockGetNextDefaultMagnetAction: JestMockFn<
  [any, any],
  MagnetAction
> = getNextDefaultMagnetAction
const mockHandleFormChange: JestMockFn<any, FormPatch> = handleFormChange

beforeEach(() => {
  jest.clearAllMocks()

  mock_getStepFormData.mockReturnValue(null)
  // NOTE: selectStep doesn't use the results of these selectors directly,
  // it just passes their results into steplist/formLevel fns that we also mock
  mockGetSavedStepForms.mockReturnValue('getSaveStepFormsMockReturn')
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
  describe('new (never before saved) step', () => {
    it('should select a pristine pause step & populate initial values', () => {
      const mockedInitialFormData = { id: '123', stepType: 'pause' }
      mock_getStepFormData.mockReturnValue(mockedInitialFormData)
      const store = mockStore({})

      // $FlowFixMe(IL, 2020-03-10): problem dispatching a thunk with mock dispatch
      store.dispatch(selectStep('newStepId', 'pause'))

      expect(store.getActions()).toEqual([
        { type: 'SELECT_STEP', payload: 'newStepId' },
        { type: 'POPULATE_FORM', payload: mockedInitialFormData },
      ])
    })

    it('should call handleFormChange with a default pipette for "moveLiquid" step', () => {
      const mockedInitialFormData = {
        id: 'newStepId',
        stepType: 'moveLiquid',
        pipette: null,
      }

      mockHandleFormChange.mockReturnValue({
        pipette: 'somePipette',
      })
      mockGetNextDefaultPipetteId.mockReturnValue('somePipette')
      mock_getStepFormData.mockReturnValue(mockedInitialFormData)
      const store = mockStore({})

      // $FlowFixMe(IL, 2020-03-10): problem dispatching a thunk with mock dispatch
      store.dispatch(selectStep('newStepId', 'moveLiquid'))

      expect(mockHandleFormChange.mock.calls).toEqual([
        [
          { pipette: 'somePipette' },
          mockedInitialFormData,
          'pipetteEntityMockReturn',
          'labwareEntityMockReturn',
        ],
      ])

      expect(store.getActions()).toEqual([
        { type: 'SELECT_STEP', payload: 'newStepId' },
        {
          type: 'POPULATE_FORM',
          payload: {
            ...mockedInitialFormData,
            pipette: 'somePipette',
          },
        },
      ])
    })

    it('should set a default magnetic module for magnet step, and set engage height and magnetAction=engage, for magnet > engage', () => {
      mockGetSingleMagneticModuleId.mockReturnValue('someMagneticModuleId')
      mockGetNextDefaultMagnetAction.mockReturnValue('engage')
      mockGetMagnetLabwareEngageHeight.mockReturnValue(12)

      const mockedInitialFormData = {
        id: 'newStepId',
        stepType: 'magnet',
        moduleId: null,
      }
      mock_getStepFormData.mockReturnValue(mockedInitialFormData)
      const store = mockStore({})

      // $FlowFixMe(IL, 2020-03-10): problem dispatching a thunk with mock dispatch
      store.dispatch(selectStep('newStepId', 'magnet'))

      expect(store.getActions()).toEqual([
        { type: 'SELECT_STEP', payload: 'newStepId' },
        {
          type: 'POPULATE_FORM',
          payload: {
            ...mockedInitialFormData,
            moduleId: 'someMagneticModuleId',
            engageHeight: '12',
            magnetAction: 'engage',
          },
        },
      ])
    })

    it('should set a default magnetic module for magnet step, and set magnetAction=disengage, for magnet > disengage', () => {
      mockGetSingleMagneticModuleId.mockReturnValue('someMagneticModuleId')
      mockGetNextDefaultMagnetAction.mockReturnValue('disengage')

      const mockedInitialFormData = {
        id: 'newStepId',
        stepType: 'magnet',
        moduleId: null,
      }
      mock_getStepFormData.mockReturnValue(mockedInitialFormData)
      const store = mockStore({})

      // $FlowFixMe(IL, 2020-03-10): problem dispatching a thunk with mock dispatch
      store.dispatch(selectStep('newStepId', 'magnet'))

      expect(store.getActions()).toEqual([
        { type: 'SELECT_STEP', payload: 'newStepId' },
        {
          type: 'POPULATE_FORM',
          payload: {
            ...mockedInitialFormData,
            moduleId: 'someMagneticModuleId',
            engageHeight: null,
            magnetAction: 'disengage',
          },
        },
      ])
    })

    it('should set a default temperature module for Temperature step', () => {
      mockGetNextDefaultTemperatureModuleId.mockReturnValue(
        'someTemperatureModuleId'
      )

      const mockedInitialFormData = {
        id: 'newStepId',
        stepType: 'temperature',
        moduleId: null,
      }
      mock_getStepFormData.mockReturnValue(mockedInitialFormData)
      const store = mockStore({})

      // $FlowFixMe(IL, 2020-03-10): problem dispatching a thunk with mock dispatch
      store.dispatch(selectStep('newStepId', 'temperature'))

      expect(store.getActions()).toEqual([
        { type: 'SELECT_STEP', payload: 'newStepId' },
        {
          type: 'POPULATE_FORM',
          payload: {
            ...mockedInitialFormData,
            moduleId: 'someTemperatureModuleId',
          },
        },
      ])
    })
  })

  describe('selecting previously-saved step', () => {
    it('should restore a saved step', () => {
      const existingStep = {
        stepType: 'pause',
        id: 'existingStepId',
        stepName: 'Example pause',
        stepDetails: 'details',
        pauseAction: PAUSE_UNTIL_RESUME,
      }
      mock_getStepFormData.mockReturnValue(existingStep)
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
