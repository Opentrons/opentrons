import { round } from 'lodash'
import first from 'lodash/first'
import floor from 'lodash/floor'
import min from 'lodash/min'

import {
  FLEX_ROBOT_TYPE,
  getAllLabwareDefs,
  getAllLiquidClassDefs,
  getFlexNameConversion,
  getPipetteSpecsV2,
  linearInterpolate,
  POSITION_REFERENCE_BOTTOM,
  POSITION_REFERENCE_TOP,
  SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
} from '@opentrons/shared-data'
import { getTransferPlanAndReferenceVolumes } from '@opentrons/step-generation'

import {
  CHANNELS_MAPPED_TO_MAX_SPEED,
  DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_EDGE,
  PROTOCOL_DESIGNER_SOURCE,
} from '../../constants'
import { getMaxUiFlowRate } from '../../pages/Designer/ProtocolSteps/StepForm/PipetteFields/utils'
import {
  getDefaultBlowoutFlowRate,
  getDefaultPushOutVolume,
  getMatchingTipLiquidSpecsFromSpec,
} from '../../utils'
import { getMigratedPositionFromTop } from './utils/getMigrationPositionFromTop'

import type {
  LabwareDefinition2,
  PipetteV2Specs,
  ProtocolFile,
  RobotType,
} from '@opentrons/shared-data'
import type { Ingredients } from '@opentrons/step-generation'
import type { PDMetadata } from '../../file-types'
import type { FormData } from '../../form-types'

const getMigratedBlowoutFlowRate = (
  form: FormData,
  pipetteSpecs: PipetteV2Specs | null,
  tipRackDef: LabwareDefinition2 | null
): number | null => {
  return (form.blowout_checkbox || form.disposalVolume_checkbox) &&
    !form.blowout_flowRate &&
    pipetteSpecs != null &&
    tipRackDef != null
    ? getDefaultBlowoutFlowRate(Number(form.volume), pipetteSpecs, tipRackDef)
    : null
}

const getMigratedBlowoutLocation = (
  form: FormData,
  firstTrashBinOrWasteChuteId: string | null
): string | null => {
  const { blowout_checkbox, blowout_location, disposalVolume_checkbox } = form
  const doesBlowoutNeedMigration =
    (blowout_checkbox === true || disposalVolume_checkbox === true) &&
    blowout_location == null
  return doesBlowoutNeedMigration && firstTrashBinOrWasteChuteId != null
    ? firstTrashBinOrWasteChuteId
    : blowout_location
}

const getClippedFlowRateForMoveLiquid = (args: {
  formData: FormData
  rawFlowRate: number | null
  flowRateType: 'aspirate' | 'dispense' | 'blowout'
  robotType: RobotType
  pipetteSpecs: PipetteV2Specs | null
}): number | null => {
  const { formData, rawFlowRate, flowRateType, robotType, pipetteSpecs } = args
  if (pipetteSpecs == null) {
    console.warn('No pipette specs found. Using old flow rate.')
    return null
  }
  const rawFlowRateNumber = Number(rawFlowRate)
  const volume = Number(formData.volume)
  const path = 'path' in formData ? formData.path : 'singleDispense'
  const liquidClasses = getAllLiquidClassDefs()
  const liquidClass = liquidClasses[formData.liquidClass]
  const pipetteName = getFlexNameConversion(pipetteSpecs)
  const tiprack = formData.tipRack
  const tipLiquidSpecs = liquidClass?.byPipette
    .find(byPipette => byPipette.pipetteModel === pipetteName)
    ?.byTipType.find(byTipType => byTipType.tiprack === tiprack)
  const tiprackDef = getAllLabwareDefs()[tiprack]
  let correctionVolume: number = 0
  if (tipLiquidSpecs != null && flowRateType !== 'blowout') {
    const liquidClassLookup =
      flowRateType === 'dispense'
        ? path === 'multiDispense'
          ? tipLiquidSpecs.multiDispense ?? tipLiquidSpecs.singleDispense
          : tipLiquidSpecs.singleDispense
        : tipLiquidSpecs.aspirate
    const conditioningByVolume =
      path === 'multiDispense'
        ? tipLiquidSpecs.multiDispense?.conditioningByVolume ?? []
        : []
    const disposalByVolume =
      path === 'multiDispense'
        ? tipLiquidSpecs.multiDispense?.disposalByVolume ?? []
        : []

    const { referenceVolumes } = getTransferPlanAndReferenceVolumes({
      pipetteSpecs,
      tiprackDefinition: tiprackDef,
      volume,
      path,
      numDispenseWells:
        'dispense_wells' in formData ? formData.dispense_wells : formData.wells,
      aspirateAirGapByVolume: tipLiquidSpecs.aspirate.retract
        .airGapByVolume as Array<[number, number]>,
      conditioningByVolume: conditioningByVolume as Array<[number, number]>,
      disposalByVolume: disposalByVolume as Array<[number, number]>,
    })

    correctionVolume =
      linearInterpolate(
        referenceVolumes.correction[flowRateType],
        liquidClassLookup.correctionByVolume as Array<[number, number]>
      ) ?? 0
  }

  const matchingTipLiquidSpecs = getMatchingTipLiquidSpecsFromSpec(
    pipetteSpecs,
    volume,
    formData.tipRack as string
  )

  const shaftULperMM = pipetteSpecs?.shaftULperMM
  const maxFlowRate = getMaxUiFlowRate({
    targetVolume: volume,
    channels: pipetteSpecs.channels,
    tipLiquidSpecs: matchingTipLiquidSpecs,
    flowRateType,
    robotType,
    shaftULperMM,
    correctionVolume,
  })
  let defaultFlowRate: number | null
  switch (flowRateType) {
    case 'aspirate':
      defaultFlowRate = matchingTipLiquidSpecs.defaultAspirateFlowRate.default
      break
    case 'dispense':
      defaultFlowRate = matchingTipLiquidSpecs.defaultDispenseFlowRate.default
      break
    default:
      // flowRateTypeis blowout
      defaultFlowRate = matchingTipLiquidSpecs.defaultBlowOutFlowRate.default
      break
  }

  return Math.min(
    rawFlowRate == null ? round(defaultFlowRate, 2) : rawFlowRateNumber,
    maxFlowRate
  )
}

export const migrateFile = (
  appData: ProtocolFile<PDMetadata>
): ProtocolFile<PDMetadata> => {
  const { designerApplication, robot, labwareDefinitions } = appData
  if (designerApplication == null || designerApplication?.data == null) {
    throw Error('The designerApplication key in your file is corrupt.')
  }
  const {
    savedStepForms,
    ingredients,
    labware,
    pipettes,
  } = designerApplication.data
  const { model: robotType } = robot

  const allLabwareDefsByURI =
    //  read the labware definitions key first
    //  otherwise map to all labware defs as a fallback
    //  for OpentronsAI
    Object.values(labwareDefinitions).length > 0
      ? labwareDefinitions
      : getAllLabwareDefs()
  const migratedIngredients: Ingredients = Object.entries(
    ingredients
  ).reduce<Ingredients>((acc, [id, ingredient]) => {
    acc[id] = {
      ...ingredient,
      liquidClass: null,
    }
    return acc
  }, {})

  const initialDeckSetupStep = Object.values(savedStepForms).find(
    form => form.id === '__INITIAL_DECK_SETUP_STEP__'
  )
  const firstTrashBinOrWasteChuteId =
    first([
      ...Object.keys(
        (initialDeckSetupStep?.trashBinLocationUpdate as Record<
          string,
          string
        >) ?? {}
      ),
      ...Object.keys(
        (initialDeckSetupStep?.wasteChuteLocationUpdate as Record<
          string,
          string
        >) ?? {}
      ),
    ]) ?? null

  if (firstTrashBinOrWasteChuteId == null) {
    console.error(
      'No trash bin or waste chute found in the initial deck setup step. Protocol file may have been corrupted.'
    )
  }

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
        blowout_location,
        // intentionally destructure but do not pass these deprecated fields
        aspirate_delay_mmFromBottom,
        dispense_delay_mmFromBottom,
        blowout_z_offset,
        ...rest
      } = form
      const aspirateLabwareUri = labware[aspirate_labware].labwareDefURI
      const isAspirateLabwareTouchtipDisabled = allLabwareDefsByURI[
        aspirateLabwareUri
      ].parameters.quirks?.includes('touchTipDisabled')
      const dispenseLabwareUri = labware[dispense_labware]?.labwareDefURI

      const isDispenseLabwareTouchtipDisabled =
        //  dispense is in a waste chute/trash bin
        allLabwareDefsByURI[dispenseLabwareUri] == null
          ? true
          : allLabwareDefsByURI[dispenseLabwareUri].parameters.quirks?.includes(
              'touchTipDisabled'
            )

      const migratedBlowoutLocation = getMigratedBlowoutLocation(
        form,
        firstTrashBinOrWasteChuteId
      )
      const matchingAspirateLabwareWellDepth = getMigratedPositionFromTop(
        allLabwareDefsByURI,
        aspirate_labware as string,
        labware,
        'aspirate'
      )
      const matchingDispenseLabwareWellDepth = getMigratedPositionFromTop(
        allLabwareDefsByURI,
        dispense_labware as string,
        labware,
        'dispense'
      )
      const tipRackDef = allLabwareDefsByURI[form.tipRack]
      const pipetteName = pipettes?.[form.pipette]?.pipetteName ?? null
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

      const migratedAspirateFlowRate = getClippedFlowRateForMoveLiquid({
        formData: form,
        rawFlowRate: form.aspirate_flowRate,
        flowRateType: 'aspirate',
        robotType,
        pipetteSpecs,
      })

      const migratedDispenseFlowRate = getClippedFlowRateForMoveLiquid({
        formData: form,
        rawFlowRate: form.dispense_flowRate,
        flowRateType: 'dispense',
        robotType,
        pipetteSpecs,
      })

      const migratedClippedBlowoutFlowRate = getClippedFlowRateForMoveLiquid({
        formData: form,
        rawFlowRate:
          // migratedBlowoutFlowRate is only returned if the input form data has that field as null
          migratedBlowoutFlowRate == null
            ? form.blowout_flowRate
            : migratedBlowoutFlowRate,
        flowRateType: 'blowout',
        robotType,
        pipetteSpecs,
      })

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
          aspirate_flowRate: migratedAspirateFlowRate,
          dispense_flowRate: migratedDispenseFlowRate,
          aspirate_retract_delay_seconds: 0,
          dispense_retract_delay_seconds: 0,
          aspirate_retract_speed: maxZSpeed,
          dispense_retract_speed: maxZSpeed,
          aspirate_submerge_delay_seconds: 0,
          dispense_submerge_delay_seconds: 0,
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
          ...(migratedClippedBlowoutFlowRate != null
            ? { blowout_flowRate: migratedClippedBlowoutFlowRate }
            : {}),
          blowout_location: migratedBlowoutLocation,
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
          labware: formLabware,
          liquidClassesSupported,
          mix_touchTip_checkbox,
          ...rest
        } = form
        const tipRackDef = allLabwareDefsByURI[form.tipRack]
        const mixLabwareUri = labware[formLabware].labwareDefURI
        const isLabwareTouchtipDisabled = allLabwareDefsByURI[
          mixLabwareUri
        ].parameters.quirks?.includes('touchTipDisabled')
        const pipetteName = pipettes?.[form.pipette]?.pipetteName ?? null
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
          allLabwareDefsByURI,
          formLabware as string,
          labware,
          'mix'
        )

        // blowout flow rate is required, so we attempt to migrate it if it's not present
        const migratedBlowoutFlowRate = getMigratedBlowoutFlowRate(
          form,
          pipetteSpecs,
          tipRackDef
        )

        const migratedBlowoutLocation = getMigratedBlowoutLocation(
          form,
          firstTrashBinOrWasteChuteId
        )

        const migratedAspirateFlowRate = getClippedFlowRateForMoveLiquid({
          formData: form,
          rawFlowRate: form.aspirate_flowRate,
          flowRateType: 'aspirate',
          robotType,
          pipetteSpecs,
        })

        const migratedDispenseFlowRate = getClippedFlowRateForMoveLiquid({
          formData: form,
          rawFlowRate: form.dispense_flowRate,
          flowRateType: 'dispense',
          robotType,
          pipetteSpecs,
        })

        const migratedClippedBlowoutFlowRate = getClippedFlowRateForMoveLiquid({
          formData: form,
          rawFlowRate:
            // migratedBlowoutFlowRate is only returned if the input form data has that field as null
            migratedBlowoutFlowRate == null
              ? form.blowout_flowRate
              : migratedBlowoutFlowRate,
          flowRateType: 'blowout',
          robotType,
          pipetteSpecs,
        })

        return {
          ...acc,
          [id]: {
            ...rest,
            id,
            labware: formLabware,
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
            ...(migratedClippedBlowoutFlowRate != null
              ? { blowout_flowRate: migratedClippedBlowoutFlowRate }
              : {}),
            blowout_location: migratedBlowoutLocation,
            aspirate_flowRate: migratedAspirateFlowRate,
            dispense_flowRate: migratedDispenseFlowRate,
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
