import last from 'lodash/last'

import {
  ABSORBANCE_READER_TYPE,
  ALL,
  FLEX_STACKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  VACUUM_MODULE_TYPE,
} from '@opentrons/shared-data'

import {
  ABSORBANCE_READER_INITIALIZE,
  ABSORBANCE_READER_LID,
  ABSORBANCE_READER_READ,
} from '../../constants'
import { maskField } from '../../steplist/fieldLevel'
import {
  createBlankForm,
  getNextDefaultEngageHeight,
  getNextDefaultMagnetAction,
  getNextDefaultPipetteId,
  getNextDefaultTemperatureModuleId,
  getNextDefaultThermocyclerModuleId,
  handleFormChange,
} from '../../steplist/formLevel'
import {
  getMagnetLabwareEngageHeight,
  getModuleOnDeckByType,
} from '../../ui/modules/utils'

import type {
  AbsorbanceReaderState,
  AdditionalEquipmentEntities,
  LabwareEntities,
  PipetteEntities,
  RobotState,
  Timeline,
} from '@opentrons/step-generation'
import type { FormData, StepIdType, StepType } from '../../form-types'
import type { FormPatch } from '../../steplist/actions/types'
import type { OrderedStepIdsState, SavedStepFormState } from '../reducers'
import type { InitialDeckSetup } from '../types'

export interface CreatePresavedStepFormArgs {
  stepId: StepIdType
  stepType: StepType
  pipetteEntities: PipetteEntities
  labwareEntities: LabwareEntities
  savedStepForms: SavedStepFormState
  orderedStepIds: OrderedStepIdsState
  initialDeckSetup: InitialDeckSetup
  robotStateTimeline: Timeline
  additionalEquipmentEntities: AdditionalEquipmentEntities
}
type FormUpdater = (arg0: FormData) => FormPatch | null

const _patchDefaultPipette =
  (args: {
    initialDeckSetup: InitialDeckSetup
    labwareEntities: LabwareEntities
    orderedStepIds: OrderedStepIdsState
    pipetteEntities: PipetteEntities
    savedStepForms: SavedStepFormState
  }): FormUpdater =>
  formData => {
    const {
      initialDeckSetup,
      labwareEntities,
      orderedStepIds,
      pipetteEntities,
      savedStepForms,
    } = args
    const defaultPipetteId = getNextDefaultPipetteId(
      savedStepForms,
      orderedStepIds,
      initialDeckSetup.pipettes
    )
    const pipetteTipracks = pipetteEntities[defaultPipetteId].tiprackDefURI
    const labwareURIsOnDeck = new Set(
      Object.values(labwareEntities).map(({ labwareDefURI }) => labwareDefURI)
    )
    const firstDefaultTiprackURIOnDeck = pipetteTipracks.find(uri =>
      labwareURIsOnDeck.has(uri)
    )
    const hasPartialTipSupportedChannel =
      pipetteEntities[defaultPipetteId]?.spec.channels !== 1
    // If there is a `pipette` field in the form,
    // then set `pipette` field of new steps to the next default pipette id.
    //
    // In order to trigger dependent field changes (eg default disposal volume),
    // update the form thru handleFormChange.
    const formHasPipetteField = formData && 'pipette' in formData

    if (formHasPipetteField && defaultPipetteId !== '') {
      const updatedFields = handleFormChange(
        {
          pipette: defaultPipetteId,
          nozzles: hasPartialTipSupportedChannel ? ALL : null,
          tipRack: firstDefaultTiprackURIOnDeck ?? null,
        },
        formData,
        pipetteEntities,
        labwareEntities
      )
      return updatedFields
    }

    return null
  }

const _patchDefaultDropTipLocation =
  (args: {
    additionalEquipmentEntities: AdditionalEquipmentEntities
    labwareEntities: LabwareEntities
    pipetteEntities: PipetteEntities
  }): FormUpdater =>
  formData => {
    const { additionalEquipmentEntities, labwareEntities, pipetteEntities } =
      args
    const trashBin = Object.values(additionalEquipmentEntities).find(
      aE => aE.name === 'trashBin'
    )
    const wasteChute = Object.values(additionalEquipmentEntities).find(
      aE => aE.name === 'wasteChute'
    )
    let defaultDropTipId = null
    if (wasteChute != null) {
      defaultDropTipId = wasteChute.id
    } else if (trashBin != null) {
      defaultDropTipId = trashBin.id
    }
    const formHasDropTipField = formData && 'dropTip_location' in formData

    if (formHasDropTipField && defaultDropTipId !== null) {
      const updatedFields = handleFormChange(
        {
          dropTip_location: defaultDropTipId,
        },
        formData,
        pipetteEntities,
        labwareEntities
      )
      return updatedFields
    }

    return null
  }

const _patchDefaultLabwareLocations =
  (args: {
    labwareEntities: LabwareEntities
    pipetteEntities: PipetteEntities
    stepType: StepType
  }): FormUpdater =>
  formData => {
    const { labwareEntities, pipetteEntities, stepType } = args

    const formHasMoveLabware =
      formData && 'labware' in formData && stepType === 'moveLabware'

    const filteredLabware = Object.values(labwareEntities).filter(
      lw =>
        // Filter out the tiprack, adapter, and lid entities
        !lw.def?.parameters.isTiprack &&
        !lw.def?.allowedRoles?.includes('adapter') &&
        !lw.def?.allowedRoles?.includes('lid')
    )

    const filteredMoveLabware = Object.values(labwareEntities).filter(
      lw =>
        // Filter out adapter entities
        !lw.def?.allowedRoles?.includes('adapter')
    )

    const formHasAspirateLabware = formData && 'aspirate_labware' in formData
    const formHasMixLabware =
      formData && 'labware' in formData && stepType === 'mix'

    if (filteredLabware.length === 1 && formHasAspirateLabware) {
      return handleFormChange(
        { aspirate_labware: filteredLabware[0].id ?? null },
        formData,
        pipetteEntities,
        labwareEntities
      )
    }

    if (filteredLabware.length === 1 && formHasMixLabware) {
      return handleFormChange(
        { labware: filteredLabware[0].id ?? null },
        formData,
        pipetteEntities,
        labwareEntities
      )
    }

    if (filteredMoveLabware.length === 1 && formHasMoveLabware) {
      return handleFormChange(
        { labware: filteredMoveLabware[0].id },
        formData,
        pipetteEntities,
        labwareEntities
      )
    }

    return null
  }

const _patchDefaultMagnetFields =
  (args: {
    initialDeckSetup: InitialDeckSetup
    orderedStepIds: OrderedStepIdsState
    savedStepForms: SavedStepFormState
    stepType: StepType
  }): FormUpdater =>
  () => {
    const { initialDeckSetup, orderedStepIds, savedStepForms, stepType } = args

    if (stepType !== 'magnet') {
      return null
    }

    const moduleId =
      getModuleOnDeckByType(initialDeckSetup, MAGNETIC_MODULE_TYPE)?.id || null
    const magnetAction = getNextDefaultMagnetAction(
      savedStepForms,
      orderedStepIds
    )
    const defaultEngageHeight = getMagnetLabwareEngageHeight(
      initialDeckSetup,
      moduleId
    )
    const stringDefaultEngageHeight = defaultEngageHeight
      ? maskField('engageHeight', defaultEngageHeight)
      : null
    const prevEngageHeight = getNextDefaultEngageHeight(
      savedStepForms,
      orderedStepIds
    )
    // 'magnet' steps only.
    //
    // if no previously saved engageHeight, autopopulate with recommended value
    // recommended value is null when no labware found on module
    //
    // Bypass dependent field changes, do not use handleFormChange
    const engageHeight = prevEngageHeight || stringDefaultEngageHeight
    return {
      moduleId,
      magnetAction,
      engageHeight,
    }
  }

const _patchTemperatureModuleId =
  (args: {
    initialDeckSetup: InitialDeckSetup
    orderedStepIds: OrderedStepIdsState
    savedStepForms: SavedStepFormState
    stepType: StepType
  }): FormUpdater =>
  () => {
    const { initialDeckSetup, orderedStepIds, savedStepForms, stepType } = args
    const numOfModules =
      Object.values(initialDeckSetup.modules).filter(
        module => module.type === TEMPERATURE_MODULE_TYPE
      )?.length ?? 1
    const hasTemperatureModuleId =
      stepType === 'pause' || stepType === 'temperature'

    // Auto-populate moduleId field of 'pause' and 'temperature' steps.
    //
    // Bypass dependent field changes, do not use handleFormChange
    if (hasTemperatureModuleId && numOfModules === 1) {
      const moduleId = getNextDefaultTemperatureModuleId(
        savedStepForms,
        orderedStepIds,
        initialDeckSetup.modules
      )
      return {
        moduleId,
      }
    }

    return null
  }

const _patchHeaterShakerModuleId =
  (args: {
    initialDeckSetup: InitialDeckSetup
    orderedStepIds: OrderedStepIdsState
    savedStepForms: SavedStepFormState
    stepType: StepType
  }): FormUpdater =>
  () => {
    const { initialDeckSetup, stepType } = args
    const numOfModules =
      Object.values(initialDeckSetup.modules).filter(
        module => module.type === HEATERSHAKER_MODULE_TYPE
      )?.length ?? 1
    const hasHeaterShakerModuleId =
      stepType === 'pause' || stepType === 'heaterShaker'

    // Auto-populate moduleId field of 'pause' and 'heaterShaker' steps.
    // Note, if both a temperature module and a heater shaker module are present, the pause form
    // will default to use the heater shaker
    // Bypass dependent field changes, do not use handleFormChange
    if (hasHeaterShakerModuleId && numOfModules === 1) {
      const moduleId =
        getModuleOnDeckByType(initialDeckSetup, HEATERSHAKER_MODULE_TYPE)?.id ??
        null
      if (moduleId != null) {
        return {
          moduleId,
        }
      }
    }

    return null
  }

const _patchFlexStackerModuleId =
  (args: {
    initialDeckSetup: InitialDeckSetup
    stepType: StepType
  }): FormUpdater =>
  () => {
    const { initialDeckSetup, stepType } = args
    const numOfModules =
      Object.values(initialDeckSetup.modules).filter(
        module => module.type === FLEX_STACKER_MODULE_TYPE
      )?.length ?? 1
    const hasFlexStackerModuleId = stepType === 'flexStacker'
    // pre-select form type if module is set
    if (hasFlexStackerModuleId && numOfModules === 1) {
      const moduleId =
        getModuleOnDeckByType(initialDeckSetup, FLEX_STACKER_MODULE_TYPE)?.id ??
        null
      if (moduleId == null) {
        return null
      }
      // get labware details in hopper at moment
      return {
        moduleId,
      }
    }
    return null
  }

const _patchAbsorbanceReaderModuleId =
  (args: {
    initialDeckSetup: InitialDeckSetup
    orderedStepIds: OrderedStepIdsState
    savedStepForms: SavedStepFormState
    stepType: StepType
    robotStateTimeline: Timeline
  }): FormUpdater =>
  () => {
    const { initialDeckSetup, stepType, robotStateTimeline } = args
    const numOfModules =
      Object.values(initialDeckSetup.modules).filter(
        module => module.type === ABSORBANCE_READER_TYPE
      )?.length ?? 1
    const hasAbsorbanceReaderModuleId = stepType === 'absorbanceReader'

    // todo(mm, 2025-12-15): If this is the first step in the timeline (i.e. last()
    // returns null), it seems like this ought to fall back to the initial module state
    // defined by step-generation.
    const robotState: RobotState | null =
      last(robotStateTimeline.timeline)?.robotState ?? null

    const modules = robotState?.modules ?? {}
    const labware = robotState?.labware ?? {}

    // pre-select form type if module is set
    if (hasAbsorbanceReaderModuleId && numOfModules === 1) {
      const moduleId =
        getModuleOnDeckByType(initialDeckSetup, ABSORBANCE_READER_TYPE)?.id ??
        null

      if (moduleId == null) {
        return null
      }

      const isLabwareOnAbsorbanceReader = Object.values(labware).some(lw =>
        lw.stack.includes(moduleId)
      )
      const absorbanceReaderState = modules[moduleId]
        ?.moduleState as AbsorbanceReaderState | null
      const initialization = absorbanceReaderState?.initialization ?? null
      const enableReadOrInitialization =
        !isLabwareOnAbsorbanceReader || initialization != null
      const compoundCommandType = isLabwareOnAbsorbanceReader
        ? ABSORBANCE_READER_READ
        : ABSORBANCE_READER_INITIALIZE
      return {
        moduleId,
        absorbanceReaderFormType: enableReadOrInitialization
          ? compoundCommandType
          : ABSORBANCE_READER_LID,
      }
    }

    return null
  }

const _patchVacuumModuleId =
  (args: {
    initialDeckSetup: InitialDeckSetup
    stepType: StepType
  }): FormUpdater =>
  () => {
    const { initialDeckSetup, stepType } = args
    const numOfModules =
      Object.values(initialDeckSetup.modules).filter(
        module => module.type === VACUUM_MODULE_TYPE
      )?.length ?? 1
    const isVacuumStep = stepType === 'vacuum'
    if (isVacuumStep && numOfModules === 1) {
      const moduleId =
        getModuleOnDeckByType(initialDeckSetup, VACUUM_MODULE_TYPE)?.id ?? null
      if (moduleId != null) {
        return {
          moduleId,
        }
      }
    }

    return null
  }

const _patchThermocyclerFields =
  (args: {
    initialDeckSetup: InitialDeckSetup
    stepType: StepType
    robotStateTimeline: Timeline
  }): FormUpdater =>
  () => {
    const { initialDeckSetup, stepType, robotStateTimeline } = args

    if (stepType !== 'thermocycler') {
      return null
    }

    const moduleId = getNextDefaultThermocyclerModuleId(
      initialDeckSetup.modules
    )
    // todo(mm, 2025-12-15): If this is the first step in the timeline (i.e. last()
    // returns null), it seems like this ought to fall back to the initial module state
    // defined by step-generation.
    const lastRobotState: RobotState | null | undefined = last(
      robotStateTimeline.timeline
    )?.robotState

    const moduleState =
      moduleId != null ? lastRobotState?.modules[moduleId]?.moduleState : null

    if (moduleState != null && moduleState.type === THERMOCYCLER_MODULE_TYPE) {
      return {
        moduleId,
        blockIsActive:
          moduleState.currentBlockActivity.type === 'blockTargetTemp',
        blockTargetTemp:
          moduleState.currentBlockActivity.type === 'blockTargetTemp'
            ? moduleState.currentBlockActivity.blockTargetTemp
            : null,
        lidIsActive: moduleState.lidTargetTemp !== null,
        lidTargetTemp: moduleState.lidTargetTemp,
        lidOpen: moduleState.lidOpen,
      }
    }

    // if there's no last robot state (eg upstream errors), still should return moduleId
    return {
      moduleId,
    }
  }

const _patchMoveLabwareFields =
  (args: {
    additionalEquipmentEntities: AdditionalEquipmentEntities
    stepType: StepType
  }): FormUpdater =>
  () => {
    const { additionalEquipmentEntities, stepType } = args
    const isMoveLabware = stepType === 'moveLabware'
    const hasGripper = Object.values(additionalEquipmentEntities).some(
      ({ name }) => name === 'gripper'
    )
    if (isMoveLabware && hasGripper) {
      return { useGripper: true }
    }
    return null
  }

export const createPresavedStepForm = ({
  initialDeckSetup,
  labwareEntities,
  orderedStepIds,
  pipetteEntities,
  savedStepForms,
  stepId,
  stepType,
  robotStateTimeline,
  additionalEquipmentEntities,
}: CreatePresavedStepFormArgs): FormData => {
  const formData = createBlankForm({
    stepId,
    stepType,
  })

  const updateDefaultDropTip = _patchDefaultDropTipLocation({
    labwareEntities,
    pipetteEntities,
    additionalEquipmentEntities,
  })

  const updateDefaultLabwareLocations = _patchDefaultLabwareLocations({
    labwareEntities,
    pipetteEntities,
    stepType,
  })

  const updateDefaultPipette = _patchDefaultPipette({
    initialDeckSetup,
    labwareEntities,
    orderedStepIds,
    pipetteEntities,
    savedStepForms,
  })

  const updateMagneticModuleId = _patchDefaultMagnetFields({
    initialDeckSetup,
    orderedStepIds,
    savedStepForms,
    stepType,
  })

  const updateTemperatureModuleId = _patchTemperatureModuleId({
    initialDeckSetup,
    orderedStepIds,
    savedStepForms,
    stepType,
  })

  const updateHeaterShakerModuleId = _patchHeaterShakerModuleId({
    initialDeckSetup,
    orderedStepIds,
    savedStepForms,
    stepType,
  })

  const updateAbsorbanceReaderModuleId = _patchAbsorbanceReaderModuleId({
    initialDeckSetup,
    orderedStepIds,
    savedStepForms,
    stepType,
    robotStateTimeline,
  })

  const updateFlexStackerModuleId = _patchFlexStackerModuleId({
    initialDeckSetup,
    stepType,
  })

  const updateVacuumModuleId = _patchVacuumModuleId({
    initialDeckSetup,
    stepType,
  })
  const updateThermocyclerFields = _patchThermocyclerFields({
    initialDeckSetup,
    stepType,
    robotStateTimeline,
  })

  const updateMoveLabwareFields = _patchMoveLabwareFields({
    additionalEquipmentEntities,
    stepType,
  })

  // finally, compose and apply all the updaters in order,
  // passing the applied result from one updater as the input of the next
  return [
    updateDefaultPipette,
    updateDefaultDropTip,
    updateTemperatureModuleId,
    updateThermocyclerFields,
    updateHeaterShakerModuleId,
    updateMagneticModuleId,
    updateAbsorbanceReaderModuleId,
    updateFlexStackerModuleId,
    updateDefaultLabwareLocations,
    updateMoveLabwareFields,
    updateVacuumModuleId,
  ].reduce<FormData>(
    (acc, updater: FormUpdater) => {
      const updates = updater(acc)

      if (updates === null) {
        return acc
      }

      return { ...acc, ...updates }
    },
    { ...formData }
  )
}
