import difference from 'lodash/difference'
import startCase from 'lodash/startCase'
import without from 'lodash/without'

import { SINGLE } from '@opentrons/shared-data'
import {
  DEST_WELL_BLOWOUT_DESTINATION,
  SOURCE_WELL_BLOWOUT_DESTINATION,
} from '@opentrons/step-generation'

import { i18n } from '../../../../assets/localization'
import { PAUSE_UNTIL_TEMP, PAUSE_UNTIL_TIME } from '../../../../constants'
import { PROFILE_CYCLE } from '../../../../form-types'
import {
  getDefaultsForStepType,
  getDisabledFields,
} from '../../../../steplist/formLevel'

import type { DropdownOption } from '@opentrons/components'
import type {
  LabwareEntities,
  PipetteEntities,
  PipetteEntity,
} from '@opentrons/step-generation'
import type {
  FormData,
  HydratedFormData,
  PathOption,
  ProfileItem,
  StepFieldName,
  StepType,
} from '../../../../form-types'
import type { FormError } from '../../../../steplist/formLevel'
import type { ProfileFormError } from '../../../../steplist/formLevel/profileErrors'
import type { FormWarning } from '../../../../steplist/formLevel/warnings'
import type { StepFormErrors } from '../../../../steplist/types'
import type { NozzleType } from '../../../../types'
import type { FieldProps, FieldPropsByName, FocusHandlers } from './types'

export function getBlowoutLocationOptionsForForm(args: {
  stepType: StepType
  path?: PathOption | null | undefined
}): DropdownOption[] {
  const { stepType, path } = args
  // TODO: Ian 2019-02-21 use i18n for names
  const destOption = {
    name: i18n.t('shared:destination_well'),
    value: DEST_WELL_BLOWOUT_DESTINATION,
  }
  const sourceOption = {
    name: i18n.t('shared:source_well'),
    value: SOURCE_WELL_BLOWOUT_DESTINATION,
  }

  if (stepType === 'mix') {
    return [destOption]
  } else if (stepType === 'moveLiquid') {
    switch (path) {
      case 'single': {
        return [sourceOption, destOption]
      }

      case 'multiDispense': {
        return [sourceOption, { ...destOption, disabled: true }]
      }

      case 'multiAspirate': {
        return [{ ...sourceOption, disabled: true }, destOption]
      }

      default: {
        // is moveLiquid but no path -- assume we're in batch edit mode
        // with mixed/indeterminate path values
        return [
          { ...sourceOption, disabled: true },
          { ...destOption, disabled: true },
        ]
      }
    }
  }

  return []
}
// TODO: type fieldNames, don't use `string`
export const getDirtyFields = (
  isNewStep: boolean,
  stepType: string,
  pipetteEntities: PipetteEntities,
  labwareEntities: LabwareEntities,
  formData?: FormData | null
): string[] => {
  let dirtyFields: string[] = []

  if (formData == null || isNewStep) {
    return []
  } else {
    switch (formData.stepType) {
      case 'moveLabware':
      case 'comment': {
        dirtyFields = Object.keys(formData)
        break
      }
      case 'heaterShaker': {
        const {
          heaterShakerSetTimer,
          heaterShakerTimer,
          setShake,
          targetSpeed,
          setHeaterShakerTemperature,
          targetHeaterShakerTemperature,
        } = formData

        const heaterShakerDirtyFields = [
          'moduleId',
          ...(heaterShakerSetTimer && heaterShakerTimer == null
            ? ['heaterShakerTimer']
            : []),
          ...(setShake && targetSpeed == null ? ['targetSpeed'] : []),
          ...(setHeaterShakerTemperature &&
          targetHeaterShakerTemperature == null
            ? ['targetHeaterShakerTemperature']
            : []),
        ]
        dirtyFields = heaterShakerDirtyFields
        break
      }
      case 'magnet': {
        const { engageHeight, magnetAction } = formData
        const magnetDirtyFields = ['moduleId']
        if (magnetAction === 'engage' && engageHeight == null) {
          magnetDirtyFields.push('engageHeight')
        }
        dirtyFields = magnetDirtyFields
        break
      }
      case 'temperature': {
        const { setTemperature, targetTemperature } = formData
        const temperatureDirtyFields = ['moduleId']
        if (setTemperature === 'true' && targetTemperature == null) {
          temperatureDirtyFields.push('targetTemperature')
        }
        dirtyFields = temperatureDirtyFields
        break
      }
      case 'pause': {
        const { pauseAction } = formData
        const pauseDirtyFields = []
        if (pauseAction === PAUSE_UNTIL_TEMP) {
          pauseDirtyFields.push('pauseTime')
          pauseDirtyFields.push('pauseTemperature')
          pauseDirtyFields.push('moduleId')
        } else if (pauseAction === PAUSE_UNTIL_TIME) {
          pauseDirtyFields.push('pauseTime')
        }
        dirtyFields = pauseDirtyFields
        break
      }
      case 'absorbanceReader': {
        const { absorbanceReaderFormType } = formData
        const absorbanceReaderDirtyFields = ['moduleId']
        if (absorbanceReaderFormType == null) {
          absorbanceReaderDirtyFields.push('absorbanceReaderFormType')
        } else if (absorbanceReaderFormType === 'absorbanceReaderLid') {
          absorbanceReaderDirtyFields.push('lidOpen')
        } else if (absorbanceReaderFormType === 'absorbanceReaderRead') {
          absorbanceReaderDirtyFields.push('fileName')
        }
        dirtyFields = absorbanceReaderDirtyFields
        break
      }
      case 'thermocycler': {
        const {
          blockTargetTemp,
          lidIsActiveHold,
          lidTargetTempHold,
          lidIsActive,
          blockTargetTempHold,
          blockIsActive,
          blockIsActiveHold,
          lidTargetTemp,
          thermocyclerFormType,
        } = formData
        const themocyclerDirtyFields = ['moduleId']
        if (blockIsActive && blockTargetTemp == null) {
          themocyclerDirtyFields.push('blockTargetTemp')
        }
        if (lidIsActive && lidTargetTemp == null) {
          themocyclerDirtyFields.push('lidTargetTemp')
        }
        if (thermocyclerFormType === 'thermocyclerProfile') {
          themocyclerDirtyFields.push('profileVolume')
          themocyclerDirtyFields.push('profileTargetLidTemp')
          if (blockIsActiveHold && blockTargetTempHold == null) {
            themocyclerDirtyFields.push('blockTargetTempHold')
          }
          if (lidIsActiveHold && lidTargetTempHold == null) {
            themocyclerDirtyFields.push('lidTargetTempHold')
          }
        }
        dirtyFields = themocyclerDirtyFields
        break
      }
      case 'mix': {
        const {
          pipette,
          aspirate_delay_checkbox,
          dispense_delay_checkbox,
          blowout_location,
          blowout_checkbox,
          aspirate_delay_seconds,
          dispense_delay_seconds,
          mix_touchTip_checkbox,
          mix_touchTip_mmFromTop,
          pushOut_volume,
          pushOut_checkbox,
        } = formData
        const mixDirtyFields = [
          'pipette',
          'tipRack',
          'volume',
          'wells',
          'dropTip_location',
          'times',
          'labware',
          'changeTip',
        ]
        if (pipetteEntities[pipette].spec.channels > 1) {
          mixDirtyFields.push('nozzles')
        }
        if (aspirate_delay_checkbox && aspirate_delay_seconds == null) {
          mixDirtyFields.push('aspirate_delay_seconds')
        }
        if (blowout_checkbox && blowout_location == null) {
          mixDirtyFields.push('blowout_location')
        }
        if (dispense_delay_checkbox && dispense_delay_seconds == null) {
          mixDirtyFields.push('dispense_delay_seconds')
        }
        if (mix_touchTip_checkbox && mix_touchTip_mmFromTop == null) {
          mixDirtyFields.push('mix_touchTip_mmFromTop')
        }
        if (pushOut_checkbox && pushOut_volume == null) {
          mixDirtyFields.push('pushOut_volume')
        }
        dirtyFields = mixDirtyFields
        break
      }
      case 'moveLiquid': {
        const {
          dispense_labware,
          pipette,
          pushOut_checkbox,
          pushOut_volume,
          aspirate_mix_checkbox,
          aspirate_mix_times,
          aspirate_mix_volume,
          aspirate_delay_checkbox,
          aspirate_delay_seconds,
          aspirate_touchTip_checkbox,
          aspirate_touchTip_speed,
          aspirate_touchTip_mmFromEdge,
          aspirate_airGap_checkbox,
          aspirate_airGap_volume,
          dispense_delay_checkbox,
          dispense_delay_seconds,
          dispense_mix_checkbox,
          dispense_mix_times,
          dispense_mix_volume,
          blowout_checkbox,
          blowout_location,
          blowout_flowRate,
          dispense_touchTip_checkbox,
          dispense_touchTip_speed,
          dispense_touchTip_mmFromEdge,
          dispense_airGap_checkbox,
          dispense_airGap_volume,
          disposalVolume_checkbox,
          disposalVolume_volume,
          conditioning_checkbox,
          conditioning_volume,
        } = formData
        const moveLiquidDirtyFields = [
          'pipette',
          'tipRack',
          'volume',
          'aspirate_wells',
          'dropTip_location',
          'dispense_labware',
          'aspirate_labware',
          'changeTip',
          'aspirate_submerge_delay_seconds',
          'aspirate_submerge_speed',
          'aspirate_retract_delay_seconds',
          'aspirate_retract_speed',
          'dispense_submerge_delay_seconds',
          'dispense_submerge_speed',
          'dispense_retract_delay_seconds',
          'dispense_retract_speed',
        ]
        if (
          dispense_labware != null &&
          labwareEntities[dispense_labware] != null
        ) {
          moveLiquidDirtyFields.push('dispense_wells')
        }
        if (pipetteEntities[pipette].spec.channels > 1) {
          moveLiquidDirtyFields.push('nozzles')
        }
        if (pushOut_checkbox && pushOut_volume == null) {
          moveLiquidDirtyFields.push('pushOut_volume')
        }
        if (
          aspirate_mix_checkbox &&
          (aspirate_mix_times == null || aspirate_mix_volume == null)
        ) {
          moveLiquidDirtyFields.push('aspirate_mix_times')
          moveLiquidDirtyFields.push('aspirate_mix_volume')
        }
        if (aspirate_delay_checkbox && aspirate_delay_seconds == null) {
          moveLiquidDirtyFields.push('aspirate_delay_seconds')
        }
        if (
          aspirate_touchTip_checkbox &&
          (aspirate_touchTip_speed == null ||
            aspirate_touchTip_mmFromEdge == null)
        ) {
          moveLiquidDirtyFields.push('aspirate_touchTip_mmFromEdge')
          moveLiquidDirtyFields.push('aspirate_touchTip_speed')
        }
        if (aspirate_airGap_checkbox && aspirate_airGap_volume == null) {
          moveLiquidDirtyFields.push('aspirate_airGap_volume')
        }
        if (dispense_delay_checkbox && dispense_delay_seconds == null) {
          moveLiquidDirtyFields.push('dispense_delay_seconds')
        }
        if (
          dispense_mix_checkbox &&
          (dispense_mix_volume == null || dispense_mix_times == null)
        ) {
          moveLiquidDirtyFields.push('dispense_mix_volume')
          moveLiquidDirtyFields.push('dispense_mix_times')
        }
        if (
          blowout_checkbox &&
          (blowout_location == null || blowout_flowRate == null)
        ) {
          moveLiquidDirtyFields.push('blowout_location')
          moveLiquidDirtyFields.push('blowout_flowRate')
        }
        if (
          dispense_touchTip_checkbox &&
          (dispense_touchTip_speed == null ||
            dispense_touchTip_mmFromEdge == null)
        ) {
          moveLiquidDirtyFields.push('dispense_touchTip_speed')
          moveLiquidDirtyFields.push('dispense_touchTip_mmFromEdge')
        }
        if (dispense_airGap_checkbox && dispense_airGap_volume == null) {
          moveLiquidDirtyFields.push('dispense_airGap_volume')
        }
        if (disposalVolume_checkbox && disposalVolume_volume == null) {
          moveLiquidDirtyFields.push('disposalVolume_volume')
        }
        if (conditioning_checkbox && conditioning_volume == null) {
          moveLiquidDirtyFields.push('conditioning_volume')
        }
        dirtyFields = moveLiquidDirtyFields
        break
      }

      //  NOTE: this is only hit if a new form type is created and we
      //  haven't wired up the dirty fields yet
      default: {
        dirtyFields = []
        console.error(
          `the dirty fields have not been added yet for ${stepType}`
        )
      }
    }
  }

  // exclude form "metadata" (not really fields)
  return without(
    dirtyFields,
    'stepType',
    'id',
    'stepDetails',
    'stepNumber',
    'stepName'
  )
}

export const getIsErrorOnCurrentPage = (args: {
  errors: StepFormErrors
  page: number
}): boolean => {
  const { errors, page = 0 } = args
  return errors.some(error => error.page == null || error.page === page)
}

export const getVisibleFormErrors = (args: {
  focusedField?: string | null
  dirtyFields: string[]
  errors: StepFormErrors
  page: number
  currentFormIsPresaved: boolean
  showErrors?: boolean
}): StepFormErrors => {
  const {
    focusedField,
    errors,
    page = 0,
    showErrors,
    dirtyFields,
    currentFormIsPresaved,
  } = args
  return errors.filter(error => {
    const dependentFieldsAreNotFocused = !error.dependentFields.includes(
      // @ts-expect-error(sa, 2021-6-22): focusedField might be undefined
      focusedField
    )
    const dependentFieldsAreDirty =
      difference(error.dependentFields, dirtyFields).length === 0
    const isPageImplicated = error.page != null ? page === error.page : true
    return (
      isPageImplicated &&
      dependentFieldsAreNotFocused &&
      (!currentFormIsPresaved
        ? dependentFieldsAreDirty || showErrors
        : showErrors)
    )
  })
}
export const getVisibleFormWarnings = (args: {
  focusedField?: string | null
  dirtyFields: string[]
  errors: FormWarning[]
}): FormWarning[] => {
  const { focusedField, dirtyFields, errors } = args
  return errors.filter(error => {
    const dependentFieldsAreNotFocused = !error.dependentFields.includes(
      // @ts-expect-error(sa, 2021-6-22): focusedField might be undefined
      focusedField
    )
    const dependentFieldsAreDirty =
      difference(error.dependentFields, dirtyFields).length === 0
    return dependentFieldsAreNotFocused && dependentFieldsAreDirty
  })
}
// for the purpose of focus handlers, derive a unique ID for each dynamic field
export const getDynamicFieldFocusHandlerId = ({
  id,
  name,
}: {
  id: string
  name: string
}): string => `${id}:${name}`
// NOTE: if any fields of a given name are pristine, treat all fields of that name as pristine.
// (Errors don't currently specify the id, so if we later want to only mask form-level errors
// for specific profile fields, the field's parent ProfileItem id needs to be included in the error)
export const getVisibleProfileFormLevelErrors = (args: {
  focusedField?: string | null
  dirtyFields: string[]
  errors: ProfileFormError[]
  profileItemsById: Record<string, ProfileItem>
}): ProfileFormError[] => {
  const { dirtyFields, focusedField, errors, profileItemsById } = args
  const profileItemIds = Object.keys(profileItemsById)
  return errors.filter(error => {
    return profileItemIds.every(itemId => {
      const item = profileItemsById[itemId]
      const steps = item.type === PROFILE_CYCLE ? item.steps : [item]
      return steps.every(step => {
        const fieldsForStep = error.dependentProfileFields.map(fieldName =>
          getDynamicFieldFocusHandlerId({
            id: step.id,
            name: fieldName,
          })
        )
        const dependentFieldsAreNotFocused = !fieldsForStep.includes(
          // @ts-expect-error(sa, 2021-6-22): focusedField might be undefined
          focusedField
        )
        const dependentProfileFieldsAreDirty =
          difference(fieldsForStep, dirtyFields).length === 0
        return dependentFieldsAreNotFocused && dependentProfileFieldsAreDirty
      })
    })
  })
}
export const getFieldDefaultTooltip = (name: string, t: any): string =>
  name != null ? t(`step_fields.defaults.${name}`) : ''
export const getFieldIndeterminateTooltip = (name: string, t: any): string =>
  name != null ? t(`step_fields.indeterminate.${name}`) : ''
export const getSingleSelectDisabledTooltip = (
  name: string,
  stepType: string,
  t: any
): string =>
  name != null
    ? t(`step_fields.${stepType}.disabled.${name}`)
    : t(`step_fields.${stepType}.disabled.$generic`)

export const getFieldCaptions = (
  name: string,
  t: any,
  hydratedForm: HydratedFormData
): string | null => {
  if (name == null) {
    return null
  }

  //  special-casing the volume field to add a max const
  if (name === 'volume') {
    let labware
    if (
      'dispense_labware' in hydratedForm &&
      hydratedForm.dispense_labware != null &&
      hydratedForm.stepType === 'moveLiquid'
    ) {
      labware = hydratedForm.dispense_labware
    } else if (
      'labware' in hydratedForm &&
      hydratedForm.labware != null &&
      hydratedForm.stepType === 'mix'
    ) {
      labware = hydratedForm.labware
    }

    if (labware == null) {
      return null
    }
    const dispenseLabwareMaxVolume =
      'def' in labware ? labware.def?.wells.A1.totalLiquidVolume : null
    if (dispenseLabwareMaxVolume != null) {
      return t(`protocol_steps:captions_for_fields.volume`, {
        max: dispenseLabwareMaxVolume,
      })
    } else {
      return null
    }
  } else {
    const key = `protocol_steps:captions_for_fields.${name}`
    const translated = t(key)
    return translated === `captions_for_fields.${name}` ? null : translated
  }
}

// TODO(IL, 2021-03-03): keys for fieldMap are more strictly of TipOffsetFields type,
// but since utils like addFieldNamePrefix return StepFieldName/string instead
// of strict TipOffsetFields, we have to be more lenient with the types
export function getLabwareFieldForPositioningField(
  name: StepFieldName
): StepFieldName {
  const fieldMap: Record<StepFieldName, StepFieldName> = {
    aspirate_mmFromBottom: 'aspirate_labware',
    aspirate_touchTip_mmFromTop: 'aspirate_labware',
    aspirate_delay_mmFromBottom: 'aspirate_labware',
    dispense_mmFromBottom: 'dispense_labware',
    dispense_touchTip_mmFromTop: 'dispense_labware',
    dispense_delay_mmFromBottom: 'dispense_labware',
    mix_mmFromBottom: 'labware',
    mix_touchTip_mmFromTop: 'labware',
    aspirate_retract_mmFromBottom: 'aspirate_labware',
    dispense_retract_mmFromBottom: 'dispense_labware',
    aspirate_submerge_mmFromBottom: 'aspirate_labware',
    dispense_submerge_mmFromBottom: 'dispense_labware',
  }
  return fieldMap[name]
}

export const getNozzleType = (
  pipette: PipetteEntity | null,
  nozzles: string | null
): NozzleType | null => {
  const is8Channel = pipette != null && pipette.spec.channels === 8
  if (is8Channel && nozzles !== SINGLE) {
    return '8-channel'
  } else if (nozzles != null) {
    return nozzles as NozzleType
  } else {
    return null
  }
}

interface ShowFieldErrorParams {
  name: StepFieldName
  focusedField: StepFieldName | null
  dirtyFields?: StepFieldName[]
}
export const showFieldErrors = ({
  name,
  focusedField,
  dirtyFields,
}: ShowFieldErrorParams): boolean | undefined | StepFieldName[] =>
  !(name === focusedField) && dirtyFields != null && dirtyFields.includes(name)
export const makeSingleEditFieldProps = (
  focusHandlers: FocusHandlers,
  formData: FormData,
  handleChangeFormInput: (name: string, value: unknown) => void,
  hydratedForm: HydratedFormData,
  t: any,
  visibleFormErrors: StepFormErrors
): FieldPropsByName => {
  const { blur, focus } = focusHandlers
  const fieldNames: string[] = Object.keys(
    getDefaultsForStepType(formData.stepType)
  )
  return fieldNames.reduce<FieldPropsByName>((acc, name) => {
    const disabled = hydratedForm
      ? getDisabledFields(hydratedForm).has(name)
      : false
    const value = formData ? formData[name] : null
    const mappedErrorsToField =
      visibleFormErrors?.length > 0
        ? getFormErrorsMappedToField(visibleFormErrors)
        : {}

    //  NOTE: some fields can have multiple errors, but we
    //  will always just show the first one until they're all
    //  resolved
    const error = mappedErrorsToField[name]?.[0]?.title
    const updateValue = (value: unknown): void => {
      handleChangeFormInput(name, value)
    }

    const onFieldBlur = (): void => {
      blur(name)
    }

    const onFieldFocus = (): void => {
      focus(name)
    }

    const defaultTooltip = getFieldDefaultTooltip(name, t)
    const disabledTooltip = getSingleSelectDisabledTooltip(
      name,
      formData.stepType,
      t
    )
    const caption = getFieldCaptions(name, t, hydratedForm)

    const fieldProps: FieldProps = {
      disabled,
      errorToShow: error,
      name,
      updateValue,
      value,
      onFieldBlur,
      onFieldFocus,
      tooltipContent: disabled ? disabledTooltip : defaultTooltip,
      caption: caption ?? undefined,
    }
    return { ...acc, [name]: fieldProps }
  }, {})
}

interface SaveStepSnackbarTextProps {
  numWarnings: number
  numErrors: number
  stepTypeDisplayName: string
  t: any
}
export const getSaveStepSnackbarText = (
  props: SaveStepSnackbarTextProps
): string => {
  const { numWarnings, numErrors, stepTypeDisplayName, t } = props
  if (numWarnings === 0 && numErrors > 0) {
    return t(`protocol_steps:save_errors`, {
      num: numErrors,
      stepType: stepTypeDisplayName,
    })
  } else if (numWarnings > 0 && numErrors === 0) {
    return t(`protocol_steps:save_warnings`, {
      numWarnings: numWarnings,
      stepType: stepTypeDisplayName,
    })
  } else if (numWarnings > 0 && numErrors > 0) {
    return t(`protocol_steps:save_warnings_and_errors`, {
      numWarnings: numWarnings,
      numErrors: numErrors,
      stepType: stepTypeDisplayName,
    })
  } else {
    return t(`protocol_steps:save_no_errors`, { stepType: stepTypeDisplayName })
  }
}

export const capitalizeFirstLetter = (stepName: string): string => {
  // Note - this is a special case
  if (stepName === 'absorbance plate reader') return startCase(stepName)

  // Note - check is for heater-shaker
  if (stepName.includes('-')) {
    return stepName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('-')
  } else {
    return `${stepName.charAt(0).toUpperCase()}${stepName.slice(1)}`
  }
}

export type ErrorMappedToField = Record<string, FormError>

export const getFormErrorsMappedToField = (
  formErrors: StepFormErrors
): Record<string, FormError[]> => {
  return formErrors.reduce<Record<string, FormError[]>>((acc, error) => {
    const { dependentFields, location } = error

    for (const field of dependentFields) {
      if (!acc[field]) {
        acc[field] = []
      }
      if (location === 'field') {
        acc[field].push({
          ...error,
        })
      }
    }
    return acc
  }, {})
}

export const getShouldUpdateForLiquidClass = (
  changedFields: string[],
  formType: string
): boolean => {
  switch (formType) {
    case 'moveLiquid':
      return [
        'aspirate_labware',
        'aspirate_wells',
        'pipette',
        'tipRack',
        'path',
        'liquidClass',
      ].some(field => changedFields.includes(field))
    case 'mix':
      return [
        'labware',
        'wells',
        'pipette',
        'tipRack',
        'path',
        'liquidClass',
      ].some(field => changedFields.includes(field))
    default:
      return false
  }
}
