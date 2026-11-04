import { describe, expect, it } from 'vitest'

import {
  capitalizeFirstLetterAfterNumber,
  getConsolidatedStacks,
  getFillLabwareToDeleteData,
  getShiftSelectedSteps,
} from '../utils'

import type {
  ModuleOnDeck,
  SavedStepFormState,
} from '/protocol-designer/step-forms'
import type { StepHierarchy } from '/protocol-designer/steplist/utils/stepHierarchy'

describe('capitalizeFirstLetterAfterNumber', () => {
  it('should capitalize the first letter of a step type', () => {
    expect(capitalizeFirstLetterAfterNumber('1. heater-shaker')).toBe(
      '1. Heater-Shaker'
    )
    expect(capitalizeFirstLetterAfterNumber('22. thermocycler')).toBe(
      '22. Thermocycler'
    )
  })
})

describe('getShiftSelectedSteps', () => {
  it('should return a single step if no steps were selected before', () => {
    const stepHierarchy: StepHierarchy = {
      topLevelItems: [
        { type: 'standaloneStep', stepId: 'step1' },
        { type: 'standaloneStep', stepId: 'step2' },
        { type: 'standaloneStep', stepId: 'step3' },
      ],
    }
    expect(
      getShiftSelectedSteps(null, stepHierarchy, 'step2', null, null)
    ).toStrictEqual(['step2'])
  })
  it('should return a range if a single step was selected before', () => {
    const stepHierarchy: StepHierarchy = {
      topLevelItems: [
        { type: 'standaloneStep', stepId: 'step1' },
        {
          type: 'thermocyclerProfileGroup',
          startStepId: 'step2',
          concurrentSteps: [
            { type: 'standaloneStep', stepId: 'step3' },
            { type: 'standaloneStep', stepId: 'step4' },
          ],
          waitStepId: 'step5',
        },
        { type: 'standaloneStep', stepId: 'step6' },
        { type: 'standaloneStep', stepId: 'step7' },
      ],
    }
    expect(
      getShiftSelectedSteps('step3', stepHierarchy, 'step7', null, null)
    ).toStrictEqual([
      'step3',
      'step4',
      // step5 should be skipped because it's hidden in the UI
      'step6',
      'step7',
    ])
  })
  it('should return a range if multiple steps were selected before', () => {
    const stepHierarchy: StepHierarchy = {
      topLevelItems: [
        { type: 'standaloneStep', stepId: 'step1' },
        {
          type: 'thermocyclerProfileGroup',
          startStepId: 'step2',
          concurrentSteps: [
            { type: 'standaloneStep', stepId: 'step3' },
            { type: 'standaloneStep', stepId: 'step4' },
          ],
          waitStepId: 'step5',
        },
        { type: 'standaloneStep', stepId: 'step6' },
        { type: 'standaloneStep', stepId: 'step7' },
      ],
    }
    expect(
      getShiftSelectedSteps(
        null,
        stepHierarchy,
        'step7',
        ['step2', 'step3'],
        'step3'
      )
    ).toStrictEqual([
      'step2',
      'step3',
      'step4',
      // step5 should be skipped because it's hidden in the UI
      'step6',
      'step7',
    ])
  })
})
describe('getConsolidatedStacks', () => {
  it('should return an array of stacks with no duplicates', () => {
    const labwareAtLastState = {
      labware1: { stack: ['labware1', 'C1'] },
      labware2: { stack: ['labware2', 'labware1', 'C1'] },
      labware3: { stack: ['labware3', 'labware2', 'labware1', 'C1'] },
    }
    expect(getConsolidatedStacks(labwareAtLastState)).toStrictEqual([
      ['labware3', 'labware2', 'labware1', 'C1'],
    ])
  })
})
describe('getFillLabwareToDeleteData', () => {
  const mockModule = {
    id: 'moduleId1',
    type: 'heaterShakerModuleType',
    model: 'someModel',
    slot: 'slot1',
    moduleState: {},
  }
  const anotherModule = {
    id: 'moduleId2',
    type: 'thermocyclerModuleType',
    model: 'someOtherModel',
    slot: 'slot2',
    moduleState: {},
  }
  const mockDeckSetupModules = {
    moduleId1: mockModule,
    moduleId2: anotherModule,
  } as unknown as Record<string, ModuleOnDeck>
  const savedStepForms = {
    step1: {
      id: 'step1',
      stepType: 'flexStacker',
      fillLabwareIds: ['labware1', 'labware2'],
      moduleId: 'moduleId1',
    },
    step2: {
      id: 'step2',
      stepType: 'flexStacker',
      fillLabwareIds: ['labware3'],
      moduleId: 'moduleId2',
    },
    step3: {
      id: 'step3',
      stepType: 'manualStep',
      fillLabwareIds: ['labware4'],
      moduleId: 'moduleId1',
    },
    step4: {
      id: 'step4',
      stepType: 'flexStacker',
      fillLabwareIds: null,
      moduleId: 'moduleId1',
    },
    step5: {
      id: 'step5',
      stepType: 'flexStacker',
      fillLabwareIds: ['labware5'],
      moduleId: 'doesNotExist',
    },
  } as unknown as SavedStepFormState

  it('returns correct data for single step with fill labware', () => {
    const result = getFillLabwareToDeleteData(
      ['step1'],
      savedStepForms,
      mockDeckSetupModules
    )
    expect(result).toEqual([
      { labwareIds: ['labware1', 'labware2'], module: mockModule },
    ])
  })

  it('returns correct data for multiple steps, filtering for flexStacker with valid module and non-null fillLabwareIds', () => {
    const result = getFillLabwareToDeleteData(
      ['step1', 'step2'],
      savedStepForms,
      mockDeckSetupModules
    )
    expect(result).toEqual([
      { labwareIds: ['labware1', 'labware2'], module: mockModule },
      { labwareIds: ['labware3'], module: anotherModule },
    ])
  })

  it('does not include steps that are not flexStacker', () => {
    const result = getFillLabwareToDeleteData(
      ['step3'],
      savedStepForms,
      mockDeckSetupModules
    )
    expect(result).toEqual([])
  })

  it('does not include steps with null fillLabwareIds', () => {
    const result = getFillLabwareToDeleteData(
      ['step4'],
      savedStepForms,
      mockDeckSetupModules
    )
    expect(result).toEqual([])
  })

  it('does not include steps where the module is not found', () => {
    const result = getFillLabwareToDeleteData(
      ['step5'],
      savedStepForms,
      mockDeckSetupModules
    )
    expect(result).toEqual([])
  })

  it('returns empty array if no steps match', () => {
    const result = getFillLabwareToDeleteData(
      [],
      savedStepForms,
      mockDeckSetupModules
    )
    expect(result).toEqual([])
  })

  it('handles a mix of valid and invalid steps', () => {
    const result = getFillLabwareToDeleteData(
      ['step1', 'step3', 'step4', 'step5'],
      savedStepForms,
      mockDeckSetupModules
    )
    expect(result).toEqual([
      { labwareIds: ['labware1', 'labware2'], module: mockModule },
    ])
  })
})
