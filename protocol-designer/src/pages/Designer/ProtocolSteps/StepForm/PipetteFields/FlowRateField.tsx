import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { SPACING } from '@opentrons/components'
import {
  getAllLiquidClassDefs,
  getFlexNameConversion,
  linearInterpolate,
  OT2_ROBOT_TYPE,
  WATER_LIQUID_CLASS_NAME,
} from '@opentrons/shared-data'
import { getTransferPlanAndReferenceVolumes } from '@opentrons/step-generation'

import { InputStepFormField } from '/protocol-designer/components/molecules'
import { getRobotType } from '/protocol-designer/file-data/selectors'
import { getLabwareDefsByURI } from '/protocol-designer/labware-defs/selectors'
import { selectors as stepFormSelectors } from '/protocol-designer/step-forms'
import { getMatchingTipLiquidSpecs } from '/protocol-designer/utils'

import { getMaxUiFlowRate } from './utils'

import type { ReactNode } from 'react'
import type { PathOption } from '@opentrons/step-generation'
import type { FormData } from '/protocol-designer/form-types'
import type { FlowRateType } from '/protocol-designer/resources/types'
import type { FieldProps } from '../types'

interface FlowRateFieldProps extends FieldProps {
  flowRateType: FlowRateType
  volume: unknown
  tiprack: unknown
  formData?: FormData
  pipetteId?: string | null
  showTooltip?: boolean
}

export function FlowRateField(props: FlowRateFieldProps): ReactNode {
  const {
    pipetteId,
    flowRateType,
    volume,
    tiprack,
    name,
    tooltipContent,
    padding = `0 ${SPACING.spacing16}`,
    formData,
    ...passThruProps
  } = props
  const { t, i18n } = useTranslation(['form', 'application', 'protocol_steps'])
  const [isPristine, setIsPristine] = useState<boolean>(true)
  const pipetteEntities = useSelector(stepFormSelectors.getPipetteEntities)
  const pipette = pipetteId != null ? pipetteEntities[pipetteId] : null
  const tiprackDef = useSelector(getLabwareDefsByURI)[tiprack as string]
  const robotType = useSelector(getRobotType)
  const allLiquidClassDefs = getAllLiquidClassDefs()
  const liquidClassDef =
    allLiquidClassDefs[formData?.liquidClass ?? ''] ??
    allLiquidClassDefs[WATER_LIQUID_CLASS_NAME]
  const convertedPipetteName =
    pipette != null ? getFlexNameConversion(pipette.spec) : null
  const liquidClassValuesForPipette = liquidClassDef.byPipette.find(
    ({ pipetteModel }) => convertedPipetteName === pipetteModel
  )
  const liquidClassValuesForTip = liquidClassValuesForPipette?.byTipType.find(
    tipObject => tipObject.tiprack === tiprack
  )

  const matchingTipLiquidSpecs =
    pipette != null && tiprack != null
      ? getMatchingTipLiquidSpecs(pipette.spec, volume as number, tiprackDef)
      : null

  let airGapByVolume: Array<[number, number]> = []
  // no air gap included for mix step
  if (formData?.stepType === 'moveLiquid') {
    if (flowRateType === 'aspirate') {
      airGapByVolume =
        (liquidClassValuesForTip?.aspirate.retract.airGapByVolume as Array<
          [number, number]
        >) ?? []
    } else if (flowRateType === 'dispense') {
      airGapByVolume =
        formData?.stepType === 'moveLiquid' &&
        formData.path === 'multiDispense' &&
        liquidClassValuesForTip != null &&
        'multiDispense' in liquidClassValuesForTip
          ? ((liquidClassValuesForTip.multiDispense?.retract
              .airGapByVolume as Array<[number, number]>) ?? [])
          : ((liquidClassValuesForTip?.singleDispense.retract
              .airGapByVolume as Array<[number, number]>) ?? [])
    }
  }

  const isOT2 = robotType === OT2_ROBOT_TYPE

  // if form type is 'mix', we will use single path
  const referenceVolumesForByVolumeInterpolation =
    pipette != null && tiprackDef != null && formData != null
      ? getTransferPlanAndReferenceVolumes({
          volume: Number(formData.volume),
          path: (formData.path as PathOption) ?? 'single',
          numAspirateWells:
            formData.stepType === 'moveLiquid'
              ? formData.aspirate_wells.length
              : formData.wells.length,
          numDispenseWells:
            formData.stepType === 'moveLiquid'
              ? formData.dispense_wells.length
              : formData.wells.length,
          pipetteSpecs: pipette?.spec,
          tiprackDefinition: tiprackDef,
          // multi-dispense is valid on OT-2, even though liquid class values are null
          conditioningByVolume: isOT2
            ? []
            : ((liquidClassValuesForTip?.multiDispense
                ?.conditioningByVolume as Array<[number, number]>) ?? null),
          disposalByVolume: isOT2
            ? []
            : ((liquidClassValuesForTip?.multiDispense
                ?.disposalByVolume as Array<[number, number]>) ?? null),
          aspirateAirGapByVolume: airGapByVolume,
        }).referenceVolumes
      : null
  const [referenceVolumeFlowRate, referenceVolumeCorrection] =
    flowRateType === 'aspirate'
      ? [
          referenceVolumesForByVolumeInterpolation?.flowRate.aspirate,
          referenceVolumesForByVolumeInterpolation?.correction.aspirate,
        ]
      : [
          referenceVolumesForByVolumeInterpolation?.flowRate.dispense,
          referenceVolumesForByVolumeInterpolation?.correction.dispense,
        ]
  const dispenseKeyForCorrectionVolumeInterpolation =
    formData?.path === 'multiDispense' &&
    liquidClassValuesForTip != null &&
    'multiDispense' in liquidClassValuesForTip
      ? 'multiDispense'
      : 'singleDispense'
  const correctionVolume =
    referenceVolumeCorrection != null && liquidClassValuesForTip != null
      ? linearInterpolate(
          referenceVolumeCorrection,
          liquidClassValuesForTip[
            flowRateType === 'aspirate'
              ? 'aspirate'
              : dispenseKeyForCorrectionVolumeInterpolation
          ]?.correctionByVolume as Array<[number, number]>
        )
      : 0

  let defaultFlowRate = 0
  if (pipette) {
    if (flowRateType === 'aspirate') {
      defaultFlowRate =
        matchingTipLiquidSpecs?.defaultAspirateFlowRate.default ?? 0
    } else if (flowRateType === 'dispense') {
      defaultFlowRate =
        matchingTipLiquidSpecs?.defaultDispenseFlowRate.default ?? 0
    } else if (flowRateType === 'blowout') {
      defaultFlowRate =
        matchingTipLiquidSpecs?.defaultBlowOutFlowRate.default ?? 0
    }
  }

  const title = i18n.format(
    t('protocol_steps:flow_type_title', { type: flowRateType }),
    'capitalize'
  )

  const flowRateNum = Number(passThruProps.value)
  const maxFlowRate =
    pipette != null &&
    referenceVolumeFlowRate != null &&
    matchingTipLiquidSpecs != null
      ? getMaxUiFlowRate({
          targetVolume: referenceVolumeFlowRate,
          channels: pipette.spec.channels,
          robotType,
          tipLiquidSpecs: matchingTipLiquidSpecs,
          flowRateType,
          correctionVolume: correctionVolume ?? 0,
          shaftULperMM: pipette.spec.shaftULperMM,
        })
      : null

  const isFlowRateOutOfBounds =
    (maxFlowRate != null && flowRateNum > maxFlowRate) || flowRateNum < 0

  const errorMessage =
    (passThruProps.value &&
      !isPristine &&
      passThruProps.value !== undefined &&
      flowRateNum === 0) ||
    isFlowRateOutOfBounds ||
    (isPristine && flowRateNum === 0)
      ? i18n.format(
          t('step_edit_form.field.flow_rate.error_out_of_bounds'),
          'capitalize'
        )
      : (passThruProps.errorToShow ?? null)

  useEffect(
    () => {
      if (isPristine && passThruProps.value == null) {
        passThruProps.updateValue(defaultFlowRate)
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isPristine, passThruProps]
  )

  return (
    <InputStepFormField
      {...passThruProps}
      padding={padding}
      type="number"
      setIsPristine={setIsPristine}
      errorToShow={errorMessage}
      key={`${flowRateType}_FlowRateInput`}
      title={title}
      showTooltip={false}
      name={name}
      units={t('application:units.microliterPerSec')}
      caption={
        maxFlowRate != null
          ? t('protocol_steps:valid_range', {
              max: maxFlowRate,
              unit: t('application:units.microliterPerSec'),
            })
          : null
      }
    />
  )
}
