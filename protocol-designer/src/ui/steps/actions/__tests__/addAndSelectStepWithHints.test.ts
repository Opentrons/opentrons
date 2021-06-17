import { addAndSelectStepWithHints } from '../thunks'
import { PRESAVED_STEP_ID } from '../../../../steplist/types'
import { addHint } from '../../../../tutorial/actions'
import * as uiModuleSelectors from '../../../../ui/modules/selectors'
import { selectors as labwareIngredSelectors } from '../../../../labware-ingred/selectors'
import * as fileDataSelectors from '../../../../file-data/selectors'
import { StepType } from '../../../../form-types'
jest.mock('../../../../tutorial/actions')
jest.mock('../../../../ui/modules/selectors')
jest.mock('../../../../labware-ingred/selectors')
jest.mock('../../../../file-data/selectors')
const dispatch = jest.fn()
const getState = jest.fn()
const addHintMock = addHint as jest.MockedFunction<typeof addHint>
const mockGetDeckHasLiquid = labwareIngredSelectors.getDeckHasLiquid as jest.MockedFunction<
  typeof labwareIngredSelectors.getDeckHasLiquid
>
const mockGetMagnetModuleHasLabware = uiModuleSelectors.getMagnetModuleHasLabware as jest.MockedFunction<
  typeof uiModuleSelectors.getMagnetModuleHasLabware
>
const mockGetTemperatureModuleHasLabware = uiModuleSelectors.getTemperatureModuleHasLabware as jest.MockedFunction<
  typeof uiModuleSelectors.getTemperatureModuleHasLabware
>
const mockGetThermocyclerModuleHasLabware = uiModuleSelectors.getThermocyclerModuleHasLabware as jest.MockedFunction<
  typeof uiModuleSelectors.getThermocyclerModuleHasLabware
>
const mockGetSingleTemperatureModuleId = uiModuleSelectors.getSingleTemperatureModuleId as jest.MockedFunction<
  typeof uiModuleSelectors.getSingleTemperatureModuleId
>
const mockGetSingleThermocyclerModuleId = uiModuleSelectors.getSingleThermocyclerModuleId as jest.MockedFunction<
  typeof uiModuleSelectors.getSingleThermocyclerModuleId
>
const mockGetRobotStateTimeline = fileDataSelectors.getRobotStateTimeline as jest.MockedFunction<
  typeof fileDataSelectors.getRobotStateTimeline
>
beforeEach(() => {
  jest.clearAllMocks()
  // @ts-expect-error(sa, 2021-6-17): not a valid AddHintAction
  addHintMock.mockReturnValue('addHintReturnValue')
  mockGetDeckHasLiquid.mockReturnValue(true)
  mockGetMagnetModuleHasLabware.mockReturnValue(false)
  mockGetTemperatureModuleHasLabware.mockReturnValue(false)
  mockGetThermocyclerModuleHasLabware.mockReturnValue(false)
  mockGetSingleTemperatureModuleId.mockReturnValue(null)
  mockGetSingleThermocyclerModuleId.mockReturnValue(null)
  // @ts-expect-error(sa, 2021-6-17): not a valid Timeline
  mockGetRobotStateTimeline.mockReturnValue('mockGetRobotStateTimelineValue')
})
describe('addAndSelectStepWithHints', () => {
  it('should dispatch addStep thunk, and no hints when no hints are applicable (eg pause step)', () => {
    const stepType: StepType = 'pause'
    const payload = {
      stepType,
    }
    addAndSelectStepWithHints(payload)(dispatch, getState)
    expect(dispatch.mock.calls).toEqual([
      [
        {
          type: 'ADD_STEP',
          payload: {
            id: PRESAVED_STEP_ID,
            stepType: 'pause',
          },
          meta: {
            robotStateTimeline: 'mockGetRobotStateTimelineValue',
          },
        },
      ],
    ])
  })
  it('should dispatch addStep thunk, and also ADD_HINT "add_liquids_and_labware" if we\'re adding a step that uses liquid but have no liquids on the deck', () => {
    const stepType: StepType = 'moveLiquid'
    const payload = {
      stepType,
    }
    mockGetDeckHasLiquid.mockReturnValue(false) // no liquid!

    addAndSelectStepWithHints(payload)(dispatch, getState)
    expect(addHintMock.mock.calls).toEqual([['add_liquids_and_labware']])
    expect(dispatch.mock.calls).toEqual([
      [
        {
          type: 'ADD_STEP',
          payload: {
            id: PRESAVED_STEP_ID,
            stepType: 'moveLiquid',
          },
          meta: {
            robotStateTimeline: 'mockGetRobotStateTimelineValue',
          },
        },
      ],
      ['addHintReturnValue'],
    ])
  })
  describe('ADD_HINT "module_without_labware"', () => {
    ;[
      {
        testName: 'magnet step, when magnetic module has no labware',
        stepType: 'magnet' as StepType,
        selectorValues: {
          getMagnetModuleHasLabware: false,
          getTemperatureModuleHasLabware: false,
          getThermocyclerModuleHasLabware: false,
          getSingleTemperatureModuleId: null,
          getSingleThermocyclerModuleId: null,
        },
      },
      {
        testName: 'temperature step, when temperature module has no labware',
        stepType: 'temperature' as StepType,
        selectorValues: {
          getMagnetModuleHasLabware: false,
          getTemperatureModuleHasLabware: false,
          getThermocyclerModuleHasLabware: false,
          getSingleTemperatureModuleId: 'something',
          getSingleThermocyclerModuleId: null,
        },
      },
      {
        testName: 'temperature step, when thermocycler has no labware',
        stepType: 'temperature' as StepType,
        selectorValues: {
          getMagnetModuleHasLabware: false,
          getTemperatureModuleHasLabware: false,
          getThermocyclerModuleHasLabware: false,
          getSingleTemperatureModuleId: null,
          getSingleThermocyclerModuleId: 'something',
        },
      },
    ].forEach(({ testName, stepType, selectorValues }) => {
      it(`should be dispatched (after addStep thunk is dispatched) for ${testName}`, () => {
        mockGetMagnetModuleHasLabware.mockReturnValue(
          selectorValues.getMagnetModuleHasLabware
        )
        mockGetTemperatureModuleHasLabware.mockReturnValue(
          selectorValues.getTemperatureModuleHasLabware
        )
        mockGetThermocyclerModuleHasLabware.mockReturnValue(
          selectorValues.getThermocyclerModuleHasLabware
        )
        mockGetSingleTemperatureModuleId.mockReturnValue(
          selectorValues.getSingleTemperatureModuleId
        )
        mockGetSingleThermocyclerModuleId.mockReturnValue(
          selectorValues.getSingleThermocyclerModuleId
        )
        const payload = {
          stepType,
        }
        addAndSelectStepWithHints(payload)(dispatch, getState)
        expect(addHintMock.mock.calls).toEqual([['module_without_labware']])
        expect(dispatch.mock.calls).toEqual([
          [
            {
              type: 'ADD_STEP',
              payload: {
                id: PRESAVED_STEP_ID,
                stepType,
              },
              meta: {
                robotStateTimeline: 'mockGetRobotStateTimelineValue',
              },
            },
          ],
          ['addHintReturnValue'],
        ])
      })
    })
  })
})
