import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  DIRECTION_COLUMN,
  Divider,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { getEnableTipPickupLocation } from '/protocol-designer/feature-flags/selectors'
import {
  getAdditionalEquipmentEntities,
  getLabwareEntities,
} from '/protocol-designer/step-forms/selectors'

import {
  DropTipField,
  PickUpTipField,
  TipWellSelectionField,
} from '../../PipetteFields'
import { ChangeTipField } from '../../PipetteFields/ChangeTipField'
import { TipTrackingField } from '../../PipetteFields/TipTrackingField'

import type { FormData } from '/protocol-designer/form-types'
import type { FieldPropsByName } from '../../types'

interface TipSettingsProps {
  propsForFields: FieldPropsByName
  formData: FormData
}

export function TipSettings(props: TipSettingsProps): JSX.Element {
  const { t } = useTranslation('protocol_steps')
  const { propsForFields, formData } = props

  const additionalEquipmentEntities = useSelector(
    getAdditionalEquipmentEntities
  )
  const enableTipPickupLocation = useSelector(getEnableTipPickupLocation)
  const labwares = useSelector(getLabwareEntities)
  const userSelectedDropTipLocation =
    labwares[String(propsForFields.dropTip_location.value)] != null
  const userSelectedPickUpTipLocation =
    labwares[String(propsForFields.pickUpTip_location.value)] != null

  const isDisposalLocation =
    additionalEquipmentEntities[String(propsForFields.dispense_labware.value)]
      ?.name === 'wasteChute' ||
    additionalEquipmentEntities[String(propsForFields.dispense_labware.value)]
      ?.name === 'trashBin'

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
            aspirateWells={formData.aspirate_wells}
            dispenseWells={formData.dispense_wells}
            path={formData.path}
            stepType={formData.stepType}
            isDisposalLocation={isDisposalLocation}
            tooltipContent={null}
            padding="0"
          />
          <DropTipField
            {...propsForFields.dropTip_location}
            nozzles={formData.nozzles}
            tiprackDefUri={formData.tipRack}
            tooltipContent={null}
            padding="0"
          />
        </Flex>
      </Flex>
      {enableTipPickupLocation ? (
        <>
          <Divider marginY="0" />
          <PickUpTipField {...propsForFields.pickUpTip_location} />
          {userSelectedPickUpTipLocation ? (
            <>
              <TipWellSelectionField
                {...propsForFields.pickUpTip_wellNames}
                nozzles={
                  typeof propsForFields.nozzles.value === 'string'
                    ? propsForFields.nozzles.value
                    : null
                }
                labwareId={propsForFields.pickUpTip_location.value}
                pipetteId={propsForFields.pipette.value}
              />
            </>
          ) : null}
        </>
      ) : null}
      {userSelectedDropTipLocation && enableTipPickupLocation ? (
        <>
          <Divider marginY="0" />
          <TipWellSelectionField
            {...propsForFields.dropTip_wellNames}
            nozzles={
              typeof propsForFields.nozzles.value === 'string'
                ? propsForFields.nozzles.value
                : null
            }
            labwareId={propsForFields.dropTip_location.value}
            pipetteId={propsForFields.pipette.value}
          />
        </>
      ) : null}
      <TipTrackingField
        propsForFields={propsForFields}
        padding={`0 ${SPACING.spacing16}`}
      />
    </Flex>
  )
}
