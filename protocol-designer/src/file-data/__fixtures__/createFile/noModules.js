// @flow
// Named arguments to createFile selector. This data would be the result of several selectors.
import type { StepIdType } from '../../../form-types'
import type { ModuleEntities, SavedStepFormState } from '../../../step-forms'
import type { RobotState, Timeline } from '../../../step-generation'

export const initialRobotState: RobotState = {
  labware: {
    trashId: {
      slot: '12',
    },
    tiprackId: {
      slot: '2',
    },
    plateId: {
      slot: '1',
    },
  },
  modules: {},
  pipettes: {
    pipetteId: {
      mount: 'left',
    },
  },
  liquidState: {
    pipettes: {},
    labware: {},
  },
  tipState: {
    pipettes: {},
    tipracks: {},
  },
}

export const robotStateTimeline: Timeline = {
  timeline: [
    {
      commands: [
        {
          command: 'pickUpTip',
          params: {
            pipette: 'pipetteId',
            labware: 'tiprackId',
            well: 'A1',
          },
        },
        {
          command: 'aspirate',
          params: {
            pipette: 'pipetteId',
            volume: 6,
            labware: 'plateId',
            well: 'A1',
            offsetFromBottomMm: 1,
            flowRate: 3.78,
          },
        },
        {
          command: 'dispense',
          params: {
            pipette: 'pipetteId',
            volume: 6,
            labware: 'trashId',
            well: 'A1',
            offsetFromBottomMm: 0.5,
            flowRate: 3.78,
          },
        },
        {
          command: 'dropTip',
          params: {
            pipette: 'pipetteId',
            labware: 'trashId',
            well: 'A1',
          },
        },
        {
          command: 'pickUpTip',
          params: {
            pipette: 'pipetteId',
            labware: 'tiprackId',
            well: 'B1',
          },
        },
        {
          command: 'aspirate',
          params: {
            pipette: 'pipetteId',
            volume: 6,
            labware: 'plateId',
            well: 'B1',
            offsetFromBottomMm: 1,
            flowRate: 3.78,
          },
        },
        {
          command: 'dispense',
          params: {
            pipette: 'pipetteId',
            volume: 6,
            labware: 'trashId',
            well: 'A1',
            offsetFromBottomMm: 0.5,
            flowRate: 3.78,
          },
        },
        {
          command: 'dropTip',
          params: {
            pipette: 'pipetteId',
            labware: 'trashId',
            well: 'A1',
          },
        },
      ],
      robotState: initialRobotState,
      warnings: [],
    },
  ],
  errors: null,
}

export const savedStepForms: SavedStepFormState = {
  __INITIAL_DECK_SETUP_STEP__: {
    stepType: 'manualIntervention',
    id: '__INITIAL_DECK_SETUP_STEP__',
    labwareLocationUpdate: {
      trashId: '12',
      tiprackId: '2',
      plateId: '1',
    },
    pipetteLocationUpdate: {
      pipetteId: 'left',
    },
    moduleLocationUpdate: {},
  },
  moveLiquidStepId: {
    id: 'moveLiquidStepId',
    stepType: 'moveLiquid',
    stepName: 'transfer',
    stepDetails: '',
    pipette: 'pipetteId',
    volume: '6',
    changeTip: 'always',
    path: 'single',
    aspirate_wells_grouped: false,
    aspirate_flowRate: null,
    aspirate_labware: 'plateId',
    aspirate_wells: ['A1', 'B1'],
    aspirate_wellOrder_first: 't2b',
    aspirate_wellOrder_second: 'l2r',
    aspirate_mix_checkbox: false,
    aspirate_mix_times: null,
    aspirate_mix_volume: null,
    aspirate_mmFromBottom: 1,
    aspirate_touchTip_checkbox: false,
    dispense_flowRate: null,
    dispense_labware: 'trashId',
    dispense_wells: ['A1'],
    dispense_wellOrder_first: 't2b',
    dispense_wellOrder_second: 'l2r',
    dispense_mix_checkbox: false,
    dispense_mix_times: null,
    dispense_mix_volume: null,
    dispense_mmFromBottom: 0.5,
    dispense_touchTip_checkbox: false,
    disposalVolume_checkbox: true,
    disposalVolume_volume: '1',
    blowout_checkbox: false,
    blowout_location: 'trashId',
    preWetTip: false,
  },
}
export const orderedStepIds: Array<StepIdType> = ['moveLiquidStepId']

export const moduleEntities: ModuleEntities = {}
