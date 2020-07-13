// @flow
import { addAndSelectStepWithHints } from '../thunks'
import { addHint } from '../../../../tutorial/actions'
import * as uiModuleSelectors from '../../../../ui/modules/selectors'
import { selectors as labwareIngredSelectors } from '../../../../labware-ingred/selectors'
import * as fileDataSelectors from '../../../../file-data/selectors'

import { uuid } from '../../../../utils'
jest.mock('../../../../tutorial/actions')
jest.mock('../../../../ui/modules/selectors')
jest.mock('../../../../labware-ingred/selectors')
jest.mock('../../../../file-data/selectors')
jest.mock('../../../../utils')
const dispatch = jest.fn()
const getState = jest.fn()
const stepId = 'stepId'
const mockUuid: JestMockFn<[], string> = uuid
const addHintMock: JestMockFn<[any, string], any> = addHint
const mockGetDeckHasLiquid: JestMockFn<[Object], any> =
  labwareIngredSelectors.getDeckHasLiquid
const mockGetMagnetModuleHasLabware: JestMockFn<[Object], any> =
  uiModuleSelectors.getMagnetModuleHasLabware
const mockGetTemperatureModuleHasLabware: JestMockFn<[Object], any> =
  uiModuleSelectors.getTemperatureModuleHasLabware
const mockGetThermocyclerModuleHasLabware: JestMockFn<[Object], any> =
  uiModuleSelectors.getThermocyclerModuleHasLabware
const mockGetSingleTemperatureModuleId: JestMockFn<[Object], any> =
  uiModuleSelectors.getSingleTemperatureModuleId
const mockGetSingleThermocyclerModuleId: JestMockFn<[Object], any> =
  uiModuleSelectors.getSingleThermocyclerModuleId
const mockGetRobotStateTimeline: JestMockFn<[Object], any> =
  fileDataSelectors.getRobotStateTimeline
beforeEach(() => {
  jest.clearAllMocks()

  addHintMock.mockReturnValue('addHintReturnValue')

  mockUuid.mockReturnValue(stepId)
  mockGetDeckHasLiquid.mockReturnValue(true)
  mockGetMagnetModuleHasLabware.mockReturnValue(false)
  mockGetTemperatureModuleHasLabware.mockReturnValue(false)
  mockGetThermocyclerModuleHasLabware.mockReturnValue(false)
  mockGetSingleTemperatureModuleId.mockReturnValue(null)
  mockGetSingleThermocyclerModuleId.mockReturnValue(null)
  mockGetRobotStateTimeline.mockReturnValue('mockGetRobotStateTimelineValue')
})

describe('addAndSelectStepWithHints', () => {
  it('should dispatch addStep thunk, and no hints when no hints are applicable (eg pause step)', () => {
    const stepType = 'pause'
    const payload = { stepType }
    addAndSelectStepWithHints(payload)(dispatch, getState)

    expect(dispatch.mock.calls).toEqual([
      [
        {
          type: 'ADD_STEP',
          payload: { id: stepId, stepType: 'pause' },
          meta: { robotStateTimeline: 'mockGetRobotStateTimelineValue' },
        },
      ],
    ])
  })

  it('should dispatch addStep thunk, and also ADD_HINT "add_liquids_and_labware" if we\'re adding a step that uses liquid but have no liquids on the deck', () => {
    const stepType = 'moveLiquid'
    const payload = { stepType }
    mockGetDeckHasLiquid.mockReturnValue(false) // no liquid!
    addAndSelectStepWithHints(payload)(dispatch, getState)

    expect(addHintMock.mock.calls).toEqual([['add_liquids_and_labware']])
    expect(dispatch.mock.calls).toEqual([
      [
        {
          type: 'ADD_STEP',
          payload: {
            id: stepId,
            stepType: 'moveLiquid',
          },
          meta: { robotStateTimeline: 'mockGetRobotStateTimelineValue' },
        },
      ],
      ['addHintReturnValue'],
    ])
  })

  describe('ADD_HINT "module_without_labware"', () => {
    ;[
      {
        testName: 'magnet step, when magnetic module has no labware',
        stepType: 'magnet',
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
        stepType: 'temperature',
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
        stepType: 'temperature',
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
        const payload = { stepType }
        addAndSelectStepWithHints(payload)(dispatch, getState)

        expect(addHintMock.mock.calls).toEqual([['module_without_labware']])
        expect(dispatch.mock.calls).toEqual([
          [
            {
              type: 'ADD_STEP',
              payload: { id: stepId, stepType },
              meta: { robotStateTimeline: 'mockGetRobotStateTimelineValue' },
            },
          ],
          ['addHintReturnValue'],
        ])
      })
    })
  })
})
