// @flow
import fixture_tiprack_10_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_10_ul.json'
import { fixtureP10Single } from '@opentrons/shared-data/pipette/fixtures/name'
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import { selectStep } from '../actions'
import { PAUSE_UNTIL_RESUME } from '../../../../constants'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import { selectors as uiModulesSelectors } from '../../../modules'
import type {
  InitialDeckSetup,
  PipetteEntities,
  LabwareEntities,
  SavedStepFormState,
} from '../../../../step-forms'
import type { FormData } from '../../../../form-types'
jest.mock('../../../../step-forms')
jest.mock('../../../modules')

const mock_getStepFormData: JestMockFn<[any, string, string], ?FormData> =
  stepFormSelectors._getStepFormData
const mockGetSavedStepForms: JestMockFn<[any], SavedStepFormState> =
  stepFormSelectors.getSavedStepForms
const mockGetOrderedStepIds: JestMockFn<[any], Array<string>> =
  stepFormSelectors.getOrderedStepIds
const mockGetInitialDeckSetup: JestMockFn<[any], InitialDeckSetup> =
  stepFormSelectors.getInitialDeckSetup
const mockGetPipetteEntities: JestMockFn<[any], PipetteEntities> =
  stepFormSelectors.getPipetteEntities
const mockGetLabwareEntities: JestMockFn<[any], LabwareEntities> =
  stepFormSelectors.getLabwareEntities

const mockGetSingleMagneticModuleId: JestMockFn<[any], string | null> =
  uiModulesSelectors.getSingleMagneticModuleId
const mockGetMagnetLabwareEngageHeight: JestMockFn<[any], number | null> =
  uiModulesSelectors.getMagnetLabwareEngageHeight

let existingStep
beforeEach(() => {
  jest.clearAllMocks()

  const pipetteEntity = {
    id: 'somePipette',
    name: 'p10_single',
    tiprackDefURI: 'foo',
    tiprackLabwareDef: fixture_tiprack_10_ul,
    spec: fixtureP10Single,
  }

  existingStep = {
    stepType: 'pause',
    id: 'existingStepId',
    stepName: 'Example pause',
    stepDetails: 'details',
    pauseForAmountOfTime: PAUSE_UNTIL_RESUME,
  }

  mock_getStepFormData.mockReturnValue(null) // NOTE: this should be implemented per-test if it's to be used
  mockGetSavedStepForms.mockReturnValue({
    [existingStep.id]: existingStep,
  })
  mockGetOrderedStepIds.mockReturnValue(['existingStepId'])
  mockGetInitialDeckSetup.mockReturnValue({
    pipettes: { [pipetteEntity.id]: { ...pipetteEntity, mount: 'left' } },
    modules: {},
    labware: {},
  })
  mockGetPipetteEntities.mockReturnValue({
    [pipetteEntity.id]: pipetteEntity,
  })
  mockGetLabwareEntities.mockReturnValue({})
  mockGetSingleMagneticModuleId.mockReturnValue(null)
  mockGetMagnetLabwareEngageHeight.mockReturnValue(null)
})

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

describe('selectStep', () => {
  describe('new (never before saved) step', () => {
    it('should select a pristine step & populate initial values', () => {
      // TODO(IL, 2020-03-10): refactor _getStepFormData so it's not so weird! We might remove it when we remove `legacySteps`??
      const newStepInitialValues = { id: '123', stepType: 'pause' }
      mock_getStepFormData.mockReturnValue(newStepInitialValues)
      const store = mockStore({})

      // $FlowFixMe(IL, 2020-03-10): problem dispatching a thunk with mock dispatch
      store.dispatch(selectStep('newStepId', 'moveLiquid'))

      expect(store.getActions()).toEqual([
        { type: 'SELECT_STEP', payload: 'newStepId' },
        { type: 'POPULATE_FORM', payload: newStepInitialValues },
      ])
    })

    it.todo('should set a default pipette if form has a "pipette" field')
    it.todo(
      'should set a default magnetic module and engage height for engage step'
    )
    it.todo('should set a default magnetic module for disengage step')
    it.todo('should set a default temperature module for Temperature step')
  })

  describe('selecting previously-saved step', () => {
    it('should restore a saved step', () => {
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
