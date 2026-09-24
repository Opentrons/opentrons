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
import { OT2_ROBOT_TYPE } from '@opentrons/shared-data'
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
import {
  getDeckSetupForActiveItem,
  getRobotStateAtActiveItem,
} from '/protocol-designer/top-selectors/labware-locations'

import { TipSelectionWizard } from './TipSelectionWizard'
import { useMemoizedTipAccessibilityByTiprackIdByWellName } from './TipSelectionWizard/hooks'
import {
  getAreAnyMatchingTipracksSelectable,
  getValidTiprackIds,
} from './TipSelectionWizard/utils'
import styles from './tiptrackingfield.module.css'
import { getNumPickups } from './utils'

import type { ReactNode } from 'react'
import type {
  NozzleConfigurationStyle,
  PrimaryNozzleConfigurationStyle,
} from '@opentrons/shared-data'
import type { PathOption, TipTrackingOption } from '@opentrons/step-generation'
import type { FormData } from '/protocol-designer/form-types'
import type { FieldPropsByName } from '../types'

interface TipTrackingFieldProps {
  propsForFields: FieldPropsByName
  padding?: string
  formData: FormData
}

export function TipTrackingField(props: TipTrackingFieldProps): ReactNode {
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
  const robotState = useSelector(getRobotStateAtActiveItem) ?? null
  const activeDeckSetup = useSelector(getDeckSetupForActiveItem)
  const pipette = pipetteEntities[pipetteId]
  const { spec: pipetteSpecs } = pipette
  const { channels } = pipetteSpecs
  const primaryNozzle =
    (propsForFields.primaryNozzle.value as PrimaryNozzleConfigurationStyle) ??
    getDefaultPrimaryNozzle({ nozzles, channels })
  const tiprackDefinition = Object.values(labwareEntities).find(
    tiprackEntity => tiprackEntity.labwareDefURI === formData.tipRack
  )?.def

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
              : [[0, Number(formData.conditioning_volume ?? 0)]],
          disposalByVolume:
            robotType === OT2_ROBOT_TYPE
              ? []
              : [[0, Number(formData.disposalVolume_volume ?? 0)]],
          aspirateAirGapByVolume: [
            [0, Number(formData.aspirate_airGap_volume ?? 0)],
          ],
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

  const tipAccessibilityStatus =
    useMemoizedTipAccessibilityByTiprackIdByWellName({
      nozzles,
      pipetteSpecs,
      selectedTips,
      primaryNozzle,
      pipetteId,
      tiprackUri: formData.tipRack,
    })

  const validTiprackIds = getValidTiprackIds({
    pipetteId,
    nozzles,
    channels,
    numPickups,
    primaryNozzle,
    tipAccessibilityStatus,
    invariantContext,
    robotState,
  })

  const areAnyMatchingTipracksSelectable = getAreAnyMatchingTipracksSelectable({
    allLabware: Object.values(activeDeckSetup?.labware ?? {}),
    formTiprackUri: formData.tipRack,
    pipetteSpecs,
    nozzles,
    labwareEntities,
    validTiprackIds,
    labwareRobotState: robotState?.labware ?? {},
  })

  return (
    <Flex className={styles.container}>
      <Flex className={styles.options_container}>
        <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
          {t('step_edit_form.field.tip_tracking.label')}
        </StyledText>
        <Flex className={styles.radio_buttons_container}>
          {tipTrackingOptions.map(({ title, description, value }) => (
            <RadioButton
              key={value}
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
      {formData.tip_tracking === MANUAL ? (
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
      {!areAnyMatchingTipracksSelectable ? (
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
          primaryNozzle={primaryNozzle}
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
