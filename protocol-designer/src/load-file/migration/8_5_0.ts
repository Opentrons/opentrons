import floor from 'lodash/floor'
import min from 'lodash/min'

import {
  FLEX_ROBOT_TYPE,
  getPipetteSpecsV2,
  POSITION_REFERENCE_BOTTOM,
  POSITION_REFERENCE_TOP,
  SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
} from '@opentrons/shared-data'

import {
  CHANNELS_MAPPED_TO_MAX_SPEED,
  DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_EDGE,
  PROTOCOL_DESIGNER_SOURCE,
} from '../../constants'
import { getDefaultBlowoutFlowRate, getDefaultPushOutVolume } from '../../utils'
import { getEquipmentLoadInfoFromCommands } from './utils/getEquipmentLoadInfoFromCommands'
import { getMigratedPositionFromTop } from './utils/getMigrationPositionFromTop'

import type {
  LabwareDefinition2,
  LoadLabwareCreateCommand,
  PipetteV2Specs,
  ProtocolFile,
} from '@opentrons/shared-data'
import type { Ingredients } from '@opentrons/step-generation'
import type { PDMetadata } from '../../file-types'
import type { FormData } from '../../form-types'

const getMigratedBlowoutFlowRate = (
  form: FormData,
  pipetteSpecs: PipetteV2Specs | null,
  tipRackDef: LabwareDefinition2 | null
): number | null =>
  (form.blowout_checkbox || form.disposalVolume_checkbox) &&
  !form.blowout_flowRate &&
  pipetteSpecs != null &&
  tipRackDef != null
    ? getDefaultBlowoutFlowRate(Number(form.volume), pipetteSpecs, tipRackDef)
    : null

export const migrateFile = (
  appData: ProtocolFile<PDMetadata>
): ProtocolFile<PDMetadata> => {
  const { designerApplication, commands, labwareDefinitions, robot } = appData
  if (designerApplication == null || designerApplication?.data == null) {
    throw Error('The designerApplication key in your file is corrupt.')
  }
  const { savedStepForms, ingredients } = designerApplication.data
  const { model: robotType } = robot
  const loadLabwareCommands = commands.filter(
    (command): command is LoadLabwareCreateCommand =>
      command.commandType === 'loadLabware'
  )
  const equipmentLoadInfoFromCommands = getEquipmentLoadInfoFromCommands(
    commands,
    labwareDefinitions
  )

  const migratedIngredients: Ingredients = Object.entries(
    ingredients
  ).reduce<Ingredients>((acc, [id, ingredient]) => {
    acc[id] = {
      ...ingredient,
      liquidClass: null,
    }
    return acc
  }, {})

  const savedStepsWithUpdatedMoveLiquidFields = Object.values(
    savedStepForms
  ).reduce((acc, form) => {
    if (form.stepType === 'moveLiquid') {
      const {
        id,
        aspirate_touchTip_mmFromBottom,
        dispense_touchTip_mmFromBottom,
        aspirate_labware,
        dispense_labware,
        liquidClassesSupported,
        liquidClass,
        aspirate_touchTip_checkbox,
        dispense_touchTip_checkbox,
        ...rest
      } = form
      const aspirateLabwareUri =
        equipmentLoadInfoFromCommands.labware[aspirate_labware].labwareDefURI
      const isAspirateLabwareTouchtipDisabled = labwareDefinitions[
        aspirateLabwareUri
      ].parameters.quirks?.includes('touchTipDisabled')
      const dispenseLabwareUri =
        equipmentLoadInfoFromCommands.labware[dispense_labware]?.labwareDefURI

      const isDispenseLabwareTouchtipDisabled =
        //  dispense is in a waste chute/trash bin
        labwareDefinitions[dispenseLabwareUri] == null
          ? true
          : labwareDefinitions[dispenseLabwareUri].parameters.quirks?.includes(
              'touchTipDisabled'
            )

      const matchingAspirateLabwareWellDepth = getMigratedPositionFromTop(
        labwareDefinitions,
        loadLabwareCommands,
        aspirate_labware as string,
        'aspirate'
      )
      const matchingDispenseLabwareWellDepth = getMigratedPositionFromTop(
        labwareDefinitions,
        loadLabwareCommands,
        dispense_labware as string,
        'dispense'
      )
      const tipRackDef = labwareDefinitions[form.tipRack]
      const pipetteName =
        equipmentLoadInfoFromCommands.pipettes?.[form.pipette]?.pipetteName ??
        null
      const pipetteSpecs =
        pipetteName != null ? getPipetteSpecsV2(pipetteName) : null
      const defaultPushOutVolume =
        pipetteSpecs == null
          ? null
          : getDefaultPushOutVolume(
              Number(form.volume),
              pipetteSpecs,
              tipRackDef
            )
      // blowout flow rate is required, so we attempt to migrate it if it's not present
      const migratedBlowoutFlowRate = getMigratedBlowoutFlowRate(
        form,
        pipetteSpecs,
        tipRackDef
      )
      const channelsForSpeed =
        pipetteSpecs?.channels ?? (robotType === FLEX_ROBOT_TYPE ? 96 : 8)
      const maxZSpeed =
        CHANNELS_MAPPED_TO_MAX_SPEED[robotType][channelsForSpeed].z
      const maxXYSpeed = min([
        CHANNELS_MAPPED_TO_MAX_SPEED[robotType][channelsForSpeed].x,
        CHANNELS_MAPPED_TO_MAX_SPEED[robotType][channelsForSpeed].y,
      ])

      return {
        ...acc,
        [id]: {
          ...rest,
          id,
          aspirate_labware,
          dispense_labware,
          aspirate_touchTip_checkbox: isAspirateLabwareTouchtipDisabled
            ? false
            : aspirate_touchTip_checkbox,
          aspirate_touchTip_mmFromTop:
            aspirate_touchTip_mmFromBottom == null ||
            isAspirateLabwareTouchtipDisabled
              ? null
              : floor(
                  aspirate_touchTip_mmFromBottom -
                    matchingAspirateLabwareWellDepth,
                  1
                ),
          dispense_touchTip_checkbox: isDispenseLabwareTouchtipDisabled
            ? false
            : dispense_touchTip_checkbox,
          dispense_touchTip_mmfromTop:
            dispense_touchTip_mmFromBottom == null ||
            isDispenseLabwareTouchtipDisabled
              ? null
              : floor(
                  dispense_touchTip_mmFromBottom -
                    matchingDispenseLabwareWellDepth,
                  1
                ),
          aspirate_retract_delay_seconds: null,
          dispense_retract_delay_seconds: null,
          aspirate_retract_speed: maxZSpeed,
          dispense_retract_speed: maxZSpeed,
          aspirate_submerge_delay_seconds: null,
          dispense_submerge_delay_seconds: null,
          aspirate_submerge_speed: maxZSpeed,
          dispense_submerge_speed: maxZSpeed,
          aspirate_touchTip_speed: maxXYSpeed,
          dispense_touchTip_speed: maxXYSpeed,
          aspirate_touchTip_mmFromEdge: DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_EDGE, // this field and the following were previously not configurable and defaulted to 0mm
          dispense_touchTip_mmFromEdge: DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_EDGE,
          aspirate_position_reference: POSITION_REFERENCE_BOTTOM,
          aspirate_retract_position_reference: POSITION_REFERENCE_TOP,
          aspirate_retract_mmFromBottom: SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
          aspirate_retract_x_position: null,
          aspirate_retract_y_position: null,
          aspirate_submerge_mmFromBottom: SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
          aspirate_submerge_x_position: null,
          aspirate_submerge_y_position: null,
          aspirate_submerge_position_reference: POSITION_REFERENCE_TOP,
          dispense_position_reference: POSITION_REFERENCE_BOTTOM,
          dispense_retract_position_reference: POSITION_REFERENCE_TOP,
          dispense_retract_mmFromBottom: SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
          dispense_retract_x_position: null,
          dispense_retract_y_position: null,
          dispense_submerge_position_reference: POSITION_REFERENCE_TOP,
          dispense_submerge_mmFromBottom: SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
          dispense_submerge_x_position: null,
          dispense_submerge_y_position: null,
          liquidClassesSupported: liquidClassesSupported ?? false,
          liquidClass: 'none',
          pushOut_checkbox:
            defaultPushOutVolume != null && defaultPushOutVolume > 0,
          pushOut_volume: defaultPushOutVolume,
          conditioning_checkbox: false,
          conditioning_volume: null,
          ...(migratedBlowoutFlowRate != null
            ? { blowout_flowRate: migratedBlowoutFlowRate }
            : {}),
        },
      }
    }
    return acc
  }, {})

  const savedStepsWithUpdatedMixFields = Object.values(savedStepForms).reduce(
    (acc, form) => {
      if (form.stepType === 'mix') {
        const {
          id,
          mix_touchTip_mmFromBottom,
          labware,
          liquidClassesSupported,
          mix_touchTip_checkbox,
          ...rest
        } = form
        const tipRackDef = labwareDefinitions[form.tipRack]
        const mixLabwareUri =
          equipmentLoadInfoFromCommands.labware[labware].labwareDefURI
        const isLabwareTouchtipDisabled = labwareDefinitions[
          mixLabwareUri
        ].parameters.quirks?.includes('touchTipDisabled')
        const pipetteName =
          equipmentLoadInfoFromCommands.pipettes?.[form.pipette]?.pipetteName ??
          null
        const pipetteSpecs =
          pipetteName != null ? getPipetteSpecsV2(pipetteName) : null
        const defaultPushOutVolume =
          pipetteSpecs === null
            ? null
            : getDefaultPushOutVolume(
                Number(form.volume),
                pipetteSpecs,
                tipRackDef
              )

        const matchingLabwareWellDepth = getMigratedPositionFromTop(
          labwareDefinitions,
          loadLabwareCommands,
          labware as string,
          'mix'
        )

        // blowout flow rate is required, so we attempt to migrate it if it's not present
        const migratedBlowoutFlowRate = getMigratedBlowoutFlowRate(
          form,
          pipetteSpecs,
          tipRackDef
        )
        return {
          ...acc,
          [id]: {
            ...rest,
            id,
            labware,
            mix_touchTip_checkbox: isLabwareTouchtipDisabled
              ? false
              : mix_touchTip_checkbox,
            mix_touchTip_mmFromTop:
              mix_touchTip_mmFromBottom == null || isLabwareTouchtipDisabled
                ? null
                : floor(
                    mix_touchTip_mmFromBottom - matchingLabwareWellDepth,
                    1
                  ),
            mix_position_reference: POSITION_REFERENCE_BOTTOM,
            liquidClassesSupported: liquidClassesSupported ?? false,
            liquidClass: 'none',
            pushOut_checkbox:
              defaultPushOutVolume != null && defaultPushOutVolume > 0,
            pushOut_volume: defaultPushOutVolume,
            ...(migratedBlowoutFlowRate != null
              ? { blowout_flowRate: migratedBlowoutFlowRate }
              : {}),
          },
        }
      }
      return acc
    },
    {}
  )

  return {
    ...appData,
    metadata: {
      ...appData.metadata,
      source: PROTOCOL_DESIGNER_SOURCE,
    },
    designerApplication: {
      ...designerApplication,
      data: {
        ...designerApplication.data,
        ingredients: migratedIngredients,
        savedStepForms: {
          ...designerApplication.data.savedStepForms,
          ...savedStepsWithUpdatedMoveLiquidFields,
          ...savedStepsWithUpdatedMixFields,
        },
      },
    },
  }
}
