// @flow
import { TEMPERATURE_MODULE_TYPE } from '@opentrons/shared-data'
import {
  END_TERMINAL_ITEM_ID,
  PRESAVED_STEP_ID,
  START_TERMINAL_ITEM_ID,
} from '../../../steplist/types'
import {
  SINGLE_STEP_SELECTION_TYPE,
  MULTI_STEP_SELECTION_TYPE,
  TERMINAL_ITEM_SELECTION_TYPE,
} from '../reducers'
import {
  getHoveredStepLabware,
  getSelectedStepTitleInfo,
  getActiveItem,
  getMultiSelectLastSelected,
} from '../selectors'
import * as utils from '../../modules/utils'

function createArgsForStepId(stepId, stepArgs) {
  return {
    [stepId]: {
      stepArgs,
    },
  }
}

const hoveredStepId = 'hoveredStepId'
const labware = 'well plate'
const mixCommand = 'mix'
describe('getHoveredStepLabware', () => {
  let initialDeckState
  beforeEach(() => {
    initialDeckState = {
      labware: {},
      pipettes: {},
      modules: {},
    }
  })

  it('no labware is returned when no hovered step', () => {
    const stepArgs = {
      commandCreatorFnName: mixCommand,
      labware,
    }
    const argsByStepId = createArgsForStepId(hoveredStepId, stepArgs)
    const hoveredStep = null

    const result = getHoveredStepLabware.resultFunc(
      argsByStepId,
      hoveredStep,
      initialDeckState
    )

    expect(result).toEqual([])
  })

  it('no labware is returned when step is not found', () => {
    const stepArgs = {
      commandCreatorFnName: mixCommand,
      labware,
    }
    const argsByStepId = createArgsForStepId(hoveredStepId, stepArgs)
    const hoveredStep = 'another-step'

    const result = getHoveredStepLabware.resultFunc(
      argsByStepId,
      hoveredStep,
      initialDeckState
    )

    expect(result).toEqual([])
  })

  it('no labware is returned when no step arguments', () => {
    const stepArgs = null
    const argsByStepId = createArgsForStepId(hoveredStepId, stepArgs)

    const result = getHoveredStepLabware.resultFunc(
      argsByStepId,
      hoveredStepId,
      initialDeckState
    )

    expect(result).toEqual([])
  })
  ;['consolidate', 'distribute', 'transfer'].forEach(command => {
    it(`source and destination labware is returned when ${command}`, () => {
      const sourceLabware = 'test tube'
      const stepArgs = {
        commandCreatorFnName: command,
        destLabware: labware,
        sourceLabware,
      }
      const argsByStepId = createArgsForStepId(hoveredStepId, stepArgs)

      const result = getHoveredStepLabware.resultFunc(
        argsByStepId,
        hoveredStepId,
        initialDeckState
      )

      expect(result).toEqual([sourceLabware, labware])
    })
  })

  it('labware is returned when command is mix', () => {
    const stepArgs = {
      commandCreatorFnName: mixCommand,
      labware,
    }
    const argsByStepId = createArgsForStepId(hoveredStepId, stepArgs)

    const result = getHoveredStepLabware.resultFunc(
      argsByStepId,
      hoveredStepId,
      initialDeckState
    )

    expect(result).toEqual([labware])
  })

  describe('modules', () => {
    const type = TEMPERATURE_MODULE_TYPE
    const setTempCommand = 'setTemperature'
    beforeEach(() => {
      initialDeckState = {
        labware: {
          def098: {
            slot: type,
          },
        },
        pipettes: {},
        modules: {
          abc123: {
            id: 'abc123',
            type,
            model: 'someTempModel',
            slot: '1',
            moduleState: {
              type,
              status: 'TEMPERATURE_DEACTIVATED',
              targetTemperature: null,
            },
          },
        },
      }
    })

    it('labware on module is returned when module id exists', () => {
      utils.getLabwareOnModule = jest.fn().mockReturnValue({ id: labware })
      const stepArgs = {
        commandCreatorFnName: setTempCommand,
        module: type,
      }
      const argsByStepId = createArgsForStepId(hoveredStepId, stepArgs)

      const result = getHoveredStepLabware.resultFunc(
        argsByStepId,
        hoveredStepId,
        initialDeckState
      )

      expect(result).toEqual([labware])
    })

    it('no labware is returned when no labware on module', () => {
      utils.getLabwareOnModule = jest.fn().mockReturnValue(null)
      const stepArgs = {
        commandCreatorFnName: setTempCommand,
        module: type,
      }
      const argsByStepId = createArgsForStepId(hoveredStepId, stepArgs)

      const result = getHoveredStepLabware.resultFunc(
        argsByStepId,
        hoveredStepId,
        initialDeckState
      )

      expect(result).toEqual([])
    })
  })
})

describe('getSelectedStepTitleInfo', () => {
  it('should return title info of the presaved form when the presaved terminal item is selected', () => {
    const unsavedForm = { stepName: 'The Step', stepType: 'transfer' }
    const result = getSelectedStepTitleInfo.resultFunc(
      unsavedForm,
      {},
      null,
      PRESAVED_STEP_ID
    )
    expect(result).toEqual({
      stepName: unsavedForm.stepName,
      stepType: unsavedForm.stepType,
    })
  })

  it('should return null when the start or end terminal item is selected', () => {
    const terminals = [START_TERMINAL_ITEM_ID, END_TERMINAL_ITEM_ID]
    terminals.forEach(terminalId => {
      const unsavedForm = { stepName: 'The Step', stepType: 'transfer' }
      const result = getSelectedStepTitleInfo.resultFunc(
        unsavedForm,
        {},
        null,
        PRESAVED_STEP_ID
      )
      expect(result).toEqual({
        stepName: unsavedForm.stepName,
        stepType: unsavedForm.stepType,
      })
    })
  })

  it('should return title info of the saved step when a saved step is selected', () => {
    const savedForm = { stepName: 'The Step', stepType: 'transfer' }
    const stepId = 'selectedAndSavedStepId'
    const result = getSelectedStepTitleInfo.resultFunc(
      null,
      { [stepId]: savedForm },
      stepId,
      null
    )
    expect(result).toEqual({
      stepName: savedForm.stepName,
      stepType: savedForm.stepType,
    })
  })
})

describe('getActiveItem', () => {
  const testCases = [
    {
      title: 'should show what is hovered, if anything is hovered',
      selected: {
        selectionType: MULTI_STEP_SELECTION_TYPE,
        ids: ['notTheseSteps', 'nope'],
      },
      hovered: {
        selectionType: SINGLE_STEP_SELECTION_TYPE,
        id: 'hoveredId',
      },
      expected: {
        selectionType: SINGLE_STEP_SELECTION_TYPE,
        id: 'hoveredId',
      },
    },
    {
      title:
        'should return null, if nothing is hovered and multi-select is selected',
      selected: {
        selectionType: MULTI_STEP_SELECTION_TYPE,
        ids: ['notTheseSteps', 'nope'],
      },
      hovered: null,
      expected: null,
    },
    {
      title: 'should show the single-selected step item, if nothing is hovered',
      selected: {
        selectionType: SINGLE_STEP_SELECTION_TYPE,
        id: 'singleStepId',
      },
      hovered: null,
      expected: {
        selectionType: SINGLE_STEP_SELECTION_TYPE,
        id: 'singleStepId',
      },
    },
    {
      title:
        'should show the single-selected terminal item, if nothing is hovered',
      selected: {
        selectionType: TERMINAL_ITEM_SELECTION_TYPE,
        id: 'someItem',
      },
      hovered: null,
      expected: {
        selectionType: TERMINAL_ITEM_SELECTION_TYPE,
        id: 'someItem',
      },
    },
  ]

  testCases.forEach(({ title, selected, hovered, expected }) => {
    it(title, () => {
      const result = getActiveItem.resultFunc(selected, hovered)
      expect(result).toEqual(expected)
    })
  })
})

describe('getMultiSelectLastSelected', () => {
  it('should return null if the selected item is a single step', () => {
    const result = getMultiSelectLastSelected.resultFunc({
      selectionType: SINGLE_STEP_SELECTION_TYPE,
      id: 'foo',
    })
    expect(result).toEqual(null)
  })
  it('should return null if the selected item is a terminal item', () => {
    const result = getMultiSelectLastSelected.resultFunc({
      selectionType: TERMINAL_ITEM_SELECTION_TYPE,
      id: 'foo',
    })
    expect(result).toEqual(null)
  })
  it('should return the lastSelected step Id if the selected item is a multi-selection', () => {
    const result = getMultiSelectLastSelected.resultFunc({
      selectionType: MULTI_STEP_SELECTION_TYPE,
      ids: ['foo', 'spam', 'bar'],
      lastSelected: 'spam',
    })
    expect(result).toEqual('spam')
  })
})
