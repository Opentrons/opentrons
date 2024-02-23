import { getWellRatio } from '../../../../steplist/utils'
import { getPipetteCapacity } from '../../../../pipettes/pipetteData'
import {
  volumeInCapacityForMultiDispense,
  volumeInCapacityForMultiAspirate,
} from '../../../../steplist/formLevel/handleFormChange/utils'
import { ChangeTipOptions, PipetteEntities } from '@opentrons/step-generation'
import { PathOption } from '../../../../form-types'
export type DisabledPathMap = Partial<Record<PathOption, string>> | null
export interface ValuesForPath {
  aspirate_airGap_checkbox?: boolean | null
  aspirate_airGap_volume?: string | null
  aspirate_wells?: string[] | null
  changeTip: ChangeTipOptions
  dispense_wells?: string[] | null
  pipette?: string | null
  volume?: string | null
}
export function getDisabledPathMap(
  values: ValuesForPath,
  pipetteEntities: PipetteEntities,
  t: any
): DisabledPathMap {
  const {
    aspirate_airGap_checkbox,
    aspirate_wells,
    changeTip,
    dispense_wells,
    pipette,
  } = values
  if (!pipette) return null
  const wellRatio = getWellRatio(aspirate_wells, dispense_wells)
  let disabledPathMap: Partial<Record<PathOption, string>> = {}

  // changeTip is lowest priority disable reasoning
  if (changeTip === 'perDest') {
    disabledPathMap = {
      ...disabledPathMap,
      multiDispense: t(
        'step_edit_form.field.path.subtitle.incompatible_with_per_dest'
      ),
    }
  } else if (changeTip === 'perSource') {
    disabledPathMap = {
      ...disabledPathMap,
      multiAspirate: t(
        'step_edit_form.field.path.subtitle.incompatible_with_per_source'
      ),
    }
  }

  // transfer volume overwrites change tip disable reasoning
  const pipetteEntity = pipetteEntities[pipette]
  const pipetteCapacity = pipetteEntity && getPipetteCapacity(pipetteEntity)
  const volume = Number(values.volume)
  const airGapChecked = aspirate_airGap_checkbox
  let airGapVolume = airGapChecked ? Number(values.aspirate_airGap_volume) : 0
  airGapVolume = Number.isFinite(airGapVolume) ? airGapVolume : 0
  const withinCapacityForMultiDispense = volumeInCapacityForMultiDispense({
    volume,
    pipetteCapacity,
    airGapVolume,
  })
  const withinCapacityForMultiAspirate = volumeInCapacityForMultiAspirate({
    volume,
    pipetteCapacity,
    airGapVolume,
  })

  if (!withinCapacityForMultiDispense) {
    disabledPathMap = {
      ...disabledPathMap,
      multiDispense: t('step_edit_form.field.path.subtitle.volume_too_high'),
    }
  }

  if (!withinCapacityForMultiAspirate) {
    disabledPathMap = {
      ...disabledPathMap,
      multiAspirate: t('step_edit_form.field.path.subtitle.volume_too_high'),
    }
  }

  // wellRatio overwrites all other disable reasoning
  if (wellRatio === '1:many') {
    disabledPathMap = {
      ...disabledPathMap,
      multiAspirate: t('step_edit_form.field.path.subtitle.only_many_to_1'),
    }
  } else if (wellRatio === 'many:1') {
    disabledPathMap = {
      ...disabledPathMap,
      multiDispense: t('step_edit_form.field.path.subtitle.only_1_to_many'),
    }
  } else {
    disabledPathMap = {
      ...disabledPathMap,
      multiAspirate: t('step_edit_form.field.path.subtitle.only_many_to_1'),
      multiDispense: t('step_edit_form.field.path.subtitle.only_1_to_many'),
    }
  }
  return disabledPathMap
}
