import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'

import {
  getAdditionalEquipmentEntities,
  getPipetteEntities,
} from '/protocol-designer/step-forms/selectors'

import { DropTipField } from '../../PipetteFields'
import { ChangeTipField } from '../../PipetteFields/ChangeTipField'
import { TipTrackingField } from '../../PipetteFields/TipTrackingField'

import type { ReactNode } from 'react'
import type { FormData } from '/protocol-designer/form-types'
import type { FieldPropsByName } from '../../types'

interface TipSettingsProps {
  propsForFields: FieldPropsByName
  formData: FormData
  stepType: 'moveLiquid' | 'mix'
}

export function TipSettings(props: TipSettingsProps): ReactNode {
  const { t } = useTranslation('protocol_steps')
  const { propsForFields, formData, stepType } = props
  const pipetteEntities = useSelector(getPipetteEntities)
  const channels = pipetteEntities[formData.pipette as string].spec.channels
  const additionalEquipmentEntities = useSelector(
    getAdditionalEquipmentEntities
  )

  const isDisposalLocation =
    stepType === 'moveLiquid' &&
    (additionalEquipmentEntities[String(propsForFields.dispense_labware?.value)]
      ?.name === 'wasteChute' ||
      additionalEquipmentEntities[
        String(propsForFields.dispense_labware?.value)
      ]?.name === 'trashBin')

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing16}
      paddingY={SPACING.spacing16}
    >
      <Flex
        paddingX={SPACING.spacing16}
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing8}
      >
        <StyledText desktopStyle="bodyDefaultSemiBold">
          {t('tip_management')}
        </StyledText>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
          <ChangeTipField
            {...propsForFields.changeTip}
            {...(stepType === 'moveLiquid'
              ? {
                  aspirateWells: formData.aspirate_wells,
                  dispenseWells: formData.dispense_wells,
                  path: formData.path,
                }
              : {})}
            stepType={formData.stepType}
            isDisposalLocation={isDisposalLocation}
            tooltipContent={null}
            padding="0"
          />
          <DropTipField
            {...propsForFields.dropTip_location}
            nozzles={formData.nozzles}
            channels={channels}
            tiprackDefUri={formData.tipRack}
            tooltipContent={null}
            padding="0"
          />
        </Flex>
      </Flex>
      {formData.changeTip !== 'never' ? (
        <TipTrackingField
          propsForFields={propsForFields}
          padding={`0 ${SPACING.spacing16}`}
          formData={formData}
        />
      ) : null}
    </Flex>
  )
}
