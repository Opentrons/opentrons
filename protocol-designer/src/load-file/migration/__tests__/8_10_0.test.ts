import { describe, expect, it } from 'vitest'

import {
  ALL,
  COLUMN,
  fixture96Plate,
  fixtureTiprack1000ul,
  POSITION_REFERENCE_TOP,
} from '@opentrons/shared-data'

import { migrateFile } from '../8_10_0'

import type { LabwareDefinition2, ProtocolFile } from '@opentrons/shared-data'
import type { PDMetadata } from '/protocol-designer/file-types'
import type { FormData } from '/protocol-designer/form-types'

// Alias for clarity. No separate type for this, currently.
type LegacyFormData = FormData

describe('v8.10.0 migration', () => {
  it('should add the default primary nozzle based on the existing nozzle configuration and null blowout args', () => {
    const mockLabwareEntity = {
      id: 'labware',
      labwareDefUri: 'labware-def',
      def: fixture96Plate as LabwareDefinition2,
      pythonName: 'python_labware',
    }
    const mockLabwareEquipmentEntity = {
      ...mockLabwareEntity,
      isTouchTipAllowed: true,
    }
    const initialDeckSetupStep: LegacyFormData = {
      labwareLocationUpdate: {},
      moduleLocationUpdate: {},
      pipetteLocationUpdate: {},
      trashBinLocationUpdate: {},
      wasteChuteLocationUpdate: {},
      stagingAreaLocationUpdate: {},
      gripperLocationUpdate: {},
      stepType: 'manualIntervention',
      id: '__INITIAL_DECK_SETUP_STEP__',
    }
    const originalMoveLiquidStep: LegacyFormData = {
      id: 'move-liquid-step-id',
      stepName: 'move liquid',
      stepDetails: 'move liquid details',
      stepType: 'moveLiquid',
      stepNumber: 1,
      aspirate_airGap_checkbox: false,
      aspirate_delay_checkbox: false,
      aspirate_labware: mockLabwareEntity,
      aspirate_mix_checkbox: false,
      aspirate_touchTip_checkbox: false,
      aspirate_wellOrder_first: 'l2r',
      aspirate_wellOrder_second: 'l2r',
      aspirate_wells: ['A1', 'A2'],
      blowout_checkbox: true,
      blowout_location: 'source',
      changeTip: 'once',
      dispense_airGap_checkbox: true,
      dispense_delay_checkbox: true,
      dispense_labware: mockLabwareEquipmentEntity,
      dispense_mix_checkbox: true,
      dispense_touchTip_checkbox: true,
      dispense_wellOrder_first: 'l2r',
      dispense_wellOrder_second: 'l2r',
      dispense_wells: ['A1', 'A2'],
      disposalVolume_checkbox: true,
      dropTip_location: 'trash',
      liquidClassesSupported: false,
      nozzles: COLUMN,
      path: 'single',
      pipette: 'pipetteId',
      tipRack: fixtureTiprack1000ul,
      volume: 10,
      pushOut_volume: 1,
      pushOut_checkbox: false,
      aspirate_retract_position_reference: POSITION_REFERENCE_TOP,
      aspirate_submerge_position_reference: POSITION_REFERENCE_TOP,
      aspirate_position_reference: POSITION_REFERENCE_TOP,
      dispense_retract_position_reference: POSITION_REFERENCE_TOP,
      dispense_submerge_position_reference: POSITION_REFERENCE_TOP,
      dispense_position_reference: POSITION_REFERENCE_TOP,
    }
    const input = createFile({
      orderedStepIds: [originalMoveLiquidStep.id],
      savedStepForms: Object.fromEntries(
        [initialDeckSetupStep, originalMoveLiquidStep].map(step => [
          step.id,
          step,
        ])
      ),
      pipettes: {
        pipetteId: {
          pipetteName: 'p1000_96',
        },
      },
    })
    const result = migrateFile(input)
    const { savedStepForms: resultSavedStepForms } =
      result.designerApplication!.data!
    const newMoveLiquidStep: FormData = {
      id: 'move-liquid-step-id',
      stepName: 'move liquid',
      stepDetails: 'move liquid details',
      stepType: 'moveLiquid',
      stepNumber: 1,
      aspirate_airGap_checkbox: false,
      aspirate_delay_checkbox: false,
      aspirate_labware: mockLabwareEntity,
      aspirate_mix_checkbox: false,
      aspirate_touchTip_checkbox: false,
      aspirate_wellOrder_first: 'l2r',
      aspirate_wellOrder_second: 'l2r',
      aspirate_wells: ['A1', 'A2'],
      blowout_checkbox: true,
      blowout_location: 'source',
      changeTip: 'once',
      dispense_airGap_checkbox: true,
      dispense_delay_checkbox: true,
      dispense_labware: mockLabwareEquipmentEntity,
      dispense_mix_checkbox: true,
      dispense_touchTip_checkbox: true,
      dispense_wellOrder_first: 'l2r',
      dispense_wellOrder_second: 'l2r',
      dispense_wells: ['A1', 'A2'],
      disposalVolume_checkbox: true,
      dropTip_location: 'trash',
      liquidClassesSupported: false,
      nozzles: COLUMN,
      primaryNozzle: 'A12',
      path: 'single',
      pipette: 'pipetteId',
      tipRack: fixtureTiprack1000ul,
      volume: 10,
      pushOut_volume: 1,
      pushOut_checkbox: false,
      blowout_mmFromBottom: 1,
      blowout_x_position: 0,
      blowout_y_position: 0,
      blowout_position_reference: POSITION_REFERENCE_TOP,
      aspirate_retract_position_reference: POSITION_REFERENCE_TOP,
      aspirate_submerge_position_reference: POSITION_REFERENCE_TOP,
      aspirate_position_reference: POSITION_REFERENCE_TOP,
      dispense_retract_position_reference: POSITION_REFERENCE_TOP,
      dispense_submerge_position_reference: POSITION_REFERENCE_TOP,
      dispense_position_reference: POSITION_REFERENCE_TOP,
    }
    expect(resultSavedStepForms).toStrictEqual(
      Object.fromEntries(
        [initialDeckSetupStep, newMoveLiquidStep].map(step => [step.id, step])
      )
    )
  })

  it('should add the default primary nozzle and nozzle configuration if no nozzle configuration exists', () => {
    const mockLabwareEntity = {
      id: 'labware',
      labwareDefUri: 'labware-def',
      def: fixture96Plate as LabwareDefinition2,
      pythonName: 'python_labware',
    }
    const mockLabwareEquipmentEntity = {
      ...mockLabwareEntity,
      isTouchTipAllowed: true,
    }

    const initialDeckSetupStep: LegacyFormData = {
      labwareLocationUpdate: {},
      moduleLocationUpdate: {},
      pipetteLocationUpdate: {},
      trashBinLocationUpdate: {},
      wasteChuteLocationUpdate: {},
      stagingAreaLocationUpdate: {},
      gripperLocationUpdate: {},
      stepType: 'manualIntervention',
      id: '__INITIAL_DECK_SETUP_STEP__',
    }
    const originalMoveLiquidStep: LegacyFormData = {
      id: 'move-liquid-step-id',
      stepName: 'move liquid',
      stepDetails: 'move liquid details',
      stepType: 'moveLiquid',
      stepNumber: 1,
      aspirate_airGap_checkbox: false,
      aspirate_delay_checkbox: false,
      aspirate_labware: mockLabwareEntity,
      aspirate_mix_checkbox: false,
      aspirate_touchTip_checkbox: false,
      aspirate_wellOrder_first: 'l2r',
      aspirate_wellOrder_second: 'l2r',
      aspirate_wells: ['A1', 'A2'],
      blowout_checkbox: false,
      changeTip: 'once',
      dispense_airGap_checkbox: true,
      dispense_delay_checkbox: true,
      dispense_labware: mockLabwareEquipmentEntity,
      dispense_mix_checkbox: true,
      dispense_touchTip_checkbox: true,
      dispense_wellOrder_first: 'l2r',
      dispense_wellOrder_second: 'l2r',
      dispense_wells: ['A1', 'A2'],
      disposalVolume_checkbox: true,
      dropTip_location: 'trash',
      liquidClassesSupported: false,
      path: 'single',
      pipette: 'pipetteId',
      tipRack: fixtureTiprack1000ul,
      volume: 10,
      pushOut_volume: 1,
      pushOut_checkbox: false,
      aspirate_retract_position_reference: POSITION_REFERENCE_TOP,
      aspirate_submerge_position_reference: POSITION_REFERENCE_TOP,
      aspirate_position_reference: POSITION_REFERENCE_TOP,
      dispense_retract_position_reference: POSITION_REFERENCE_TOP,
      dispense_submerge_position_reference: POSITION_REFERENCE_TOP,
      dispense_position_reference: POSITION_REFERENCE_TOP,
    }
    const input = createFile({
      orderedStepIds: [originalMoveLiquidStep.id],
      savedStepForms: Object.fromEntries(
        [initialDeckSetupStep, originalMoveLiquidStep].map(step => [
          step.id,
          step,
        ])
      ),
      pipettes: {
        pipetteId: {
          pipetteName: 'p1000_96',
        },
      },
    })
    const result = migrateFile(input)
    const { savedStepForms: resultSavedStepForms } =
      result.designerApplication!.data!
    const newMoveLiquidStep: FormData = {
      id: 'move-liquid-step-id',
      stepName: 'move liquid',
      stepDetails: 'move liquid details',
      stepType: 'moveLiquid',
      stepNumber: 1,
      aspirate_airGap_checkbox: false,
      aspirate_delay_checkbox: false,
      aspirate_labware: mockLabwareEntity,
      aspirate_mix_checkbox: false,
      aspirate_touchTip_checkbox: false,
      aspirate_wellOrder_first: 'l2r',
      aspirate_wellOrder_second: 'l2r',
      aspirate_wells: ['A1', 'A2'],
      blowout_checkbox: false,
      changeTip: 'once',
      dispense_airGap_checkbox: true,
      dispense_delay_checkbox: true,
      dispense_labware: mockLabwareEquipmentEntity,
      dispense_mix_checkbox: true,
      dispense_touchTip_checkbox: true,
      dispense_wellOrder_first: 'l2r',
      dispense_wellOrder_second: 'l2r',
      dispense_wells: ['A1', 'A2'],
      disposalVolume_checkbox: true,
      dropTip_location: 'trash',
      liquidClassesSupported: false,
      nozzles: ALL,
      primaryNozzle: 'A1',
      path: 'single',
      // the existing code claims that pipette and tipRack are not nullable, but they are:
      pipette: 'pipetteId',
      tipRack: fixtureTiprack1000ul,
      volume: 10,
      pushOut_volume: 1,
      pushOut_checkbox: false,
      aspirate_retract_position_reference: POSITION_REFERENCE_TOP,
      aspirate_submerge_position_reference: POSITION_REFERENCE_TOP,
      aspirate_position_reference: POSITION_REFERENCE_TOP,
      dispense_retract_position_reference: POSITION_REFERENCE_TOP,
      dispense_submerge_position_reference: POSITION_REFERENCE_TOP,
      dispense_position_reference: POSITION_REFERENCE_TOP,
    }
    expect(resultSavedStepForms).toStrictEqual(
      Object.fromEntries(
        [initialDeckSetupStep, newMoveLiquidStep].map(step => [step.id, step])
      )
    )
  })
})

/** Create a mock protocol file with the given commands. */
function createFile({
  orderedStepIds,
  savedStepForms,
  pipettes,
}: Pick<
  PDMetadata,
  'orderedStepIds' | 'savedStepForms' | 'pipettes'
>): ProtocolFile<PDMetadata> {
  return {
    designerApplication: {
      data: {
        orderedStepIds,
        savedStepForms,
        pipettes,
      },
    },
  } as any
}
