import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import * as formLevel from '../../../../steplist/formLevel'
import { selectors as uiModulesSelectors } from '../../../modules'
import * as actions from '../actions'

jest.mock('../../../../steplist/formLevel')
jest.mock('../../../../step-forms')

const mockStore = configureMockStore([thunk])

describe('steps actions', () => {
  describe('selectStep', () => {
    const pipetteId = 'pipetteId'
    const stepId = 'stepId'
    beforeEach(() => {
      stepFormSelectors.getInitialDeckSetup.mockReturnValue({
        pipettes: { mount: 'left' },
      })
      formLevel.getNextDefaultPipetteId.mockReturnValue(pipetteId)
      stepFormSelectors.getSavedStepForms.mockReturnValue({
        [stepId]: {
          stepType: 'magnet',
        },
      })
    })

    it('action is created to populate form with default engage height to scale when engage magnet step', () => {
      const magnetModule = 'magnet123'
      const magnetAction = 'engage'
      uiModulesSelectors.getSingleMagneticModuleId = jest
        .fn()
        .mockReturnValue(magnetModule)

      uiModulesSelectors.getMagnetLabwareEngageHeight = jest
        .fn()
        .mockReturnValue(10.9444)
      formLevel.getNextDefaultMagnetAction.mockReturnValue(magnetAction)
      formLevel.getNextDefaultEngageHeight.mockReturnValue(null)
      const store = mockStore({})

      store.dispatch(actions.selectStep(stepId, 'magnet'))

      expect(store.getActions()).toEqual([
        { type: 'SELECT_STEP', payload: stepId },
        {
          type: 'POPULATE_FORM',
          payload: {
            moduleId: magnetModule,
            magnetAction: magnetAction,
            engageHeight: '10.9',
            stepType: 'magnet',
          },
        },
      ])
    })

    it('action is created to populate form with null default engage height when engage magnet step with labware with no engage height', () => {
      const magnetModule = 'magnet123'
      const magnetAction = 'engage'
      uiModulesSelectors.getSingleMagneticModuleId = jest
        .fn()
        .mockReturnValue(magnetModule)

      uiModulesSelectors.getMagnetLabwareEngageHeight = jest
        .fn()
        .mockReturnValue(null)
      formLevel.getNextDefaultMagnetAction.mockReturnValue(magnetAction)
      formLevel.getNextDefaultEngageHeight.mockReturnValue(null)
      const store = mockStore({})

      store.dispatch(actions.selectStep(stepId, 'magnet'))

      expect(store.getActions()).toEqual([
        { type: 'SELECT_STEP', payload: stepId },
        {
          type: 'POPULATE_FORM',
          payload: {
            moduleId: magnetModule,
            magnetAction: magnetAction,
            engageHeight: null,
            stepType: 'magnet',
          },
        },
      ])
    })
  })
})
