import floor from 'lodash/floor'
import min from 'lodash/min'

import {
  FLEX_ROBOT_TYPE,
  getPipetteSpecsV2,
  POSITION_REFERENCE_BOTTOM,
  POSITION_REFERENCE_TOP,
} from '@opentrons/shared-data'

import {
  CHANNELS_MAPPED_TO_MAX_SPEED,
  DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_EDGE,
  PROTOCOL_DESIGNER_SOURCE,
} from '../../constants'
import { getDefaultPushOutVolume } from '../../utils'
import { getEquipmentLoadInfoFromCommands } from './utils/getEquipmentLoadInfoFromCommands'
import { getMigratedPositionFromTop } from './utils/getMigrationPositionFromTop'

import type {
  LoadLabwareCreateCommand,
  ProtocolFile,
} from '@opentrons/shared-data'
import type { PDMetadata } from '../../file-types'

export const migrateFile = (
  appData: ProtocolFile<PDMetadata>
): ProtocolFile<PDMetadata> => {
  const { designerApplication, commands, labwareDefinitions, robot } = appData
  if (designerApplication == null || designerApplication?.data == null) {
    throw Error('The designerApplication key in your file is corrupt.')
  }
  const { savedStepForms } = designerApplication.data
  const { model: robotType } = robot
  const loadLabwareCommands = commands.filter(
    (command): command is LoadLabwareCreateCommand =>
      command.commandType === 'loadLabware'
  )
  const equipmentLoadInfoFromCommands = getEquipmentLoadInfoFromCommands(
    commands,
    labwareDefinitions
  )

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
        ...rest
      } = form
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
          aspirate_touchTip_mmFromTop:
            aspirate_touchTip_mmFromBottom == null
              ? null
              : floor(
                  aspirate_touchTip_mmFromBottom -
                    matchingAspirateLabwareWellDepth,
                  1
                ),
          dispense_touchTip_mmfromTop:
            dispense_touchTip_mmFromBottom == null
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
          aspirate_retract_mmFromBottom: 0,
          aspirate_retract_x_position: null,
          aspirate_retract_y_position: null,
          aspirate_submerge_mmFromBottom: 0,
          aspirate_submerge_x_position: null,
          aspirate_submerge_y_position: null,
          aspirate_submerge_position_reference: POSITION_REFERENCE_TOP,
          dispense_position_reference: POSITION_REFERENCE_BOTTOM,
          dispense_retract_position_reference: POSITION_REFERENCE_TOP,
          dispense_retract_mmFromBottom: 0,
          dispense_retract_x_position: null,
          dispense_retract_y_position: null,
          dispense_submerge_position_reference: POSITION_REFERENCE_TOP,
          dispense_submerge_mmFromBottom: 0,
          dispense_submerge_x_position: null,
          dispense_submerge_y_position: null,
          liquidClassesSupported: liquidClassesSupported ?? false,
          liquidClass: 'none',
          pushOut_checkbox:
            defaultPushOutVolume != null && defaultPushOutVolume > 0,
          pushOut_volume: defaultPushOutVolume,
          conditioning_checkbox: false,
          conditioning_volume: null,
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
          ...rest
        } = form
        const tipRackDef = labwareDefinitions[form.tipRack]
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
        return {
          ...acc,
          [id]: {
            ...rest,
            id,
            labware,
            mix_touchTip_mmFromTop:
              mix_touchTip_mmFromBottom == null
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
        savedStepForms: {
          ...designerApplication.data.savedStepForms,
          ...savedStepsWithUpdatedMoveLiquidFields,
          ...savedStepsWithUpdatedMixFields,
        },
      },
    },
  }
}
