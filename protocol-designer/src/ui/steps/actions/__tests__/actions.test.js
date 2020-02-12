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
    const magnetModule = 'magnet123'
    const magnetAction = 'engage'
    beforeEach(() => {
      uiModulesSelectors.getSingleMagneticModuleId = jest
        .fn()
        .mockReturnValue(magnetModule)

      uiModulesSelectors.getMagnetLabwareEngageHeight = jest
        .fn()
        .mockReturnValue(10.9444)

      stepFormSelectors.getInitialDeckSetup.mockReturnValue({
        pipettes: { mount: 'left' },
      })

      formLevel.getNextDefaultPipetteId.mockReturnValue(pipetteId)
      formLevel.getNextDefaultMagnetAction.mockReturnValue(magnetAction)
      formLevel.getNextDefaultEngageHeight.mockReturnValue(null)
    })

    test('action is created to populate form with default engage height to scale when engage magnet step', () => {
      const store = mockStore({})

      store.dispatch(actions.selectStep(magnetModule, 'magnet'))

      expect(store.getActions()).toEqual([
        { type: 'SELECT_STEP', payload: magnetModule },
        {
          type: 'POPULATE_FORM',
          payload: {
            moduleId: magnetModule,
            magnetAction: magnetAction,
            engageHeight: '10.9',
          },
        },
      ])
    })
  })
})
