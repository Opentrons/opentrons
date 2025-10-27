import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  COLORS,
  Flex,
  InlineNotification,
  ListButton,
  RadioButton,
  SPACING,
  StyledText,
} from '@opentrons/components'
import {
  getAllLiquidClassDefs,
  getFlexNameConversion,
  OT2_ROBOT_TYPE,
  WATER_LIQUID_CLASS_NAME,
} from '@opentrons/shared-data'
import {
  AUTOMATIC,
  getDefaultPrimaryNozzle,
  getTransferPlanAndReferenceVolumes,
  MANUAL,
} from '@opentrons/step-generation'

import { getRobotType } from '/protocol-designer/file-data/selectors'
import {
  getInvariantContext,
  getLabwareEntities,
  getPipetteEntities,
} from '/protocol-designer/step-forms/selectors'

import { TipSelectionWizard } from './TipSelectionWizard'
import {
  useMemoizedTipAccessibilityByTiprackIdByWellName,
  useValidTiprackIds,
} from './TipSelectionWizard/hooks'
import styles from './tiptrackingfield.module.css'
import { getNumPickups } from './utils'

import type { NozzleConfigurationStyle } from '@opentrons/shared-data'
import type { PathOption, TipTrackingOption } from '@opentrons/step-generation'
import type { FormData } from '/protocol-designer/form-types'
import type { FieldPropsByName } from '../types'

interface TipTrackingFieldProps {
  propsForFields: FieldPropsByName
  padding?: string
  formData: FormData
}

export function TipTrackingField(props: TipTrackingFieldProps): JSX.Element {
  const { propsForFields, formData } = props
  const { t } = useTranslation(['form', 'tip_selection'])
  const [showTipSelectionModal, setShowTipSelectionModal] =
    useState<boolean>(false)
  const [selectedTips, setSelectedTips] = useState<string[][]>(
    formData.tips_selected as string[][]
  )
  const nozzles = formData.nozzles as NozzleConfigurationStyle
  const pipetteId = formData.pipette as string

  const pipetteEntities = useSelector(getPipetteEntities)
  const robotType = useSelector(getRobotType)
  const invariantContext = useSelector(getInvariantContext)
  const labwareEntities = useSelector(getLabwareEntities)
  const pipette = pipetteEntities[pipetteId]
  const { spec: pipetteSpecs } = pipette
  const { channels } = pipetteSpecs
  const tiprackDefinition = Object.values(labwareEntities).find(
    tiprackEntity => tiprackEntity.labwareDefURI === formData.tipRack
  )?.def

  const allLiquidClassDefs = getAllLiquidClassDefs()
  const liquidClassDef =
    allLiquidClassDefs[formData.liquidClass ?? ''] ??
    allLiquidClassDefs[WATER_LIQUID_CLASS_NAME]
  const convertedPipetteName =
    pipette != null ? getFlexNameConversion(pipette.spec) : null
  const liquidClassValuesForPipette = liquidClassDef.byPipette.find(
    ({ pipetteModel }) => convertedPipetteName === pipetteModel
  )
  const liquidClassValuesForTip = liquidClassValuesForPipette?.byTipType.find(
    tipObject => tipObject.tiprack === formData.tipRack
  )

  let airGapByVolume: Array<[number, number]> = []
  // no air gap included for mix step
  if (formData.stepType === 'moveLiquid') {
    airGapByVolume =
      (liquidClassValuesForTip?.aspirate.retract.airGapByVolume as Array<
        [number, number]
      >) ?? []
  }

  const transferPlanAndReferenceVolumes =
    pipette != null && tiprackDefinition != null && formData != null
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
          tiprackDefinition: tiprackDefinition,
          // multi-dispense is valid on OT-2, even though liquid class values are null
          conditioningByVolume:
            robotType === OT2_ROBOT_TYPE
              ? []
              : ((liquidClassValuesForTip?.multiDispense
                  ?.conditioningByVolume as Array<[number, number]>) ?? null),
          disposalByVolume:
            robotType === OT2_ROBOT_TYPE
              ? []
              : ((liquidClassValuesForTip?.multiDispense
                  ?.disposalByVolume as Array<[number, number]>) ?? null),
          aspirateAirGapByVolume: airGapByVolume,
        })
      : null

  const numPickups = getNumPickups({
    formData,
    multiWellHandling: transferPlanAndReferenceVolumes?.multiWellHandling,
    invariantContext,
  })

  const tipTrackingOptions: Array<{
    title: string
    description: string
    value: TipTrackingOption
  }> = [
    {
      title: t('step_edit_form.field.tip_tracking.options.automatic.title'),
      description: t(
        'step_edit_form.field.tip_tracking.options.automatic.description'
      ),
      value: AUTOMATIC,
    },
    {
      title: t('step_edit_form.field.tip_tracking.options.manual.title'),
      description: t(
        'step_edit_form.field.tip_tracking.options.manual.description'
      ),
      value: MANUAL,
    },
  ]

  const primaryNozzle = getDefaultPrimaryNozzle({
    nozzles,
    channels,
  })

  const tipAccessibilityStatus =
    useMemoizedTipAccessibilityByTiprackIdByWellName({
      nozzles,
      pipetteSpecs,
      selectedTips,
      primaryNozzle,
      pipetteId,
      tiprackUri: formData.tipRack,
    })

  const validTiprackIds = useValidTiprackIds({
    pipetteId,
    nozzles,
    channels,
    numPickups,
    primaryNozzle,
    tipAccessibilityStatus,
  })

  const hasValidTiprackForPickup = validTiprackIds.length > 0

  return (
    <Flex className={styles.container}>
      <Flex className={styles.options_container}>
        <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
          {t('step_edit_form.field.tip_tracking.label')}
        </StyledText>
        <Flex className={styles.radio_buttons_container}>
          {tipTrackingOptions.map(({ title, description, value }, i) => (
            <RadioButton
              key={i}
              buttonLabel={title}
              buttonSubLabel={{
                label: description,
                align: 'vertical',
              }}
              buttonValue={value}
              onChange={() => {
                propsForFields.tip_tracking.updateValue(value)
              }}
              isSelected={formData.tip_tracking === value}
              largeDesktopBorderRadius
            />
          ))}
        </Flex>
      </Flex>
      {formData.tip_tracking === MANUAL && hasValidTiprackForPickup ? (
        <Flex className={styles.manual_container}>
          <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
            {t('step_edit_form.field.tip_tracking.manual.title')}
          </StyledText>
          <ListButton
            width="100%"
            padding={`${SPACING.spacing20} ${SPACING.spacing12}`}
            type={
              propsForFields.tips_selected.errorToShow != null
                ? 'error'
                : 'noActive'
            }
            onClick={() => {
              setShowTipSelectionModal(true)
            }}
          >
            <StyledText desktopStyle="bodyDefaultRegular">
              {formData.tips_selected.length === 0
                ? t(
                    'step_edit_form.field.tip_tracking.manual.description.no_tips'
                  )
                : t(
                    `step_edit_form.field.tip_tracking.manual.description.has_tips_${
                      formData.tips_selected.length > 1 ? 'multiple' : 'one'
                    }`,
                    { count: formData.tips_selected.length }
                  )}
            </StyledText>
          </ListButton>
        </Flex>
      ) : null}
      {formData.tip_tracking === MANUAL && !hasValidTiprackForPickup ? (
        <InlineNotification
          type="error"
          heading={t('tip_selection:no_valid_tips_available.title')}
          message={t('tip_selection:no_valid_tips_available.body')}
        />
      ) : null}
      {showTipSelectionModal && (
        <TipSelectionWizard
          setShowTipSelectionModal={setShowTipSelectionModal}
          formTiprackUri={formData.tipRack as string}
          pipetteId={pipetteId}
          nozzles={nozzles}
          numPickups={numPickups}
          tiprackSelected={formData.tiprack_selected}
          updateFormTiprackSelected={
            propsForFields.tiprack_selected.updateValue
          }
          updateFormTipsSelected={propsForFields.tips_selected.updateValue}
          selectedTips={selectedTips}
          setSelectedTips={setSelectedTips}
          validTiprackIds={validTiprackIds}
          tipAccessibilityStatus={tipAccessibilityStatus}
        />
      )}
    </Flex>
  )
}
