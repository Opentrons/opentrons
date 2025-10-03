import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { DIRECTION_COLUMN, Divider, Flex, SPACING } from '@opentrons/components'
import { FLEX_96_CHANNEL_PIPETTES } from '@opentrons/shared-data'

import { getEnablePartialTipSupport } from '/protocol-designer/feature-flags/selectors'
import {
  getAdditionalEquipmentEntities,
  getPipetteEntities,
} from '/protocol-designer/step-forms/selectors'

import {
  LabwareField,
  PartialTipField,
  PathField,
  PipetteField,
  TiprackField,
  VolumeField,
  WellSelectionField,
} from '../../PipetteFields'

import type { FormData } from '/protocol-designer/form-types'
import type { FieldPropsByName } from '../../types'

interface FirstStepMoveLiquidToolsProps {
  propsForFields: FieldPropsByName
  formData: FormData
}

export function FirstStepMoveLiquidTools({
  propsForFields,
  formData,
}: FirstStepMoveLiquidToolsProps): JSX.Element {
  const { t } = useTranslation('protocol_steps')
  const pipettes = useSelector(getPipetteEntities)
  const enablePartialTip = useSelector(getEnablePartialTipSupport)
  const additionalEquipmentEntities = useSelector(
    getAdditionalEquipmentEntities
  )

  const { pipette, tipRack } = propsForFields
  const is96Channel =
    pipette.value != null &&
    FLEX_96_CHANNEL_PIPETTES.includes(pipettes[String(pipette.value)].name)
  const is8Channel =
    propsForFields.pipette.value != null &&
    pipettes[String(propsForFields.pipette.value)].spec.channels === 8
  const isDisposalLocation =
    additionalEquipmentEntities[String(propsForFields.dispense_labware.value)]
      ?.name === 'wasteChute' ||
    additionalEquipmentEntities[String(propsForFields.dispense_labware.value)]
      ?.name === 'trashBin'

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing12}
      paddingY={SPACING.spacing16}
    >
      <PipetteField {...propsForFields.pipette} />
      {propsForFields.pipette.value != null &&
      (is96Channel || (is8Channel && enablePartialTip)) ? (
        <>
          <Divider marginY="0" />
          <PartialTipField
            {...propsForFields.nozzles}
            pipetteSpecs={pipettes[String(propsForFields.pipette.value)]?.spec}
          />
        </>
      ) : null}
      <Divider marginY="0" />
      <TiprackField {...tipRack} pipetteId={pipette.value} />
      <Divider marginY="0" />
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
        <LabwareField {...propsForFields.aspirate_labware} />
        <WellSelectionField
          {...propsForFields.aspirate_wells}
          labwareId={
            typeof propsForFields.aspirate_labware.value === 'string'
              ? propsForFields.aspirate_labware.value
              : null
          }
          pipetteId={formData.pipette}
          nozzles={
            typeof propsForFields.nozzles.value === 'string'
              ? propsForFields.nozzles.value
              : null
          }
          hasFormError={propsForFields.aspirate_wells.errorToShow != null}
        />
      </Flex>
      <Divider marginY="0" />
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
        <LabwareField {...propsForFields.dispense_labware} />
        {isDisposalLocation ? null : (
          <WellSelectionField
            {...propsForFields.dispense_wells}
            labwareId={
              typeof propsForFields.dispense_labware.value === 'string'
                ? propsForFields.dispense_labware.value
                : null
            }
            pipetteId={formData.pipette}
            nozzles={
              typeof propsForFields.nozzles.value === 'string'
                ? propsForFields.nozzles.value
                : null
            }
            hasFormError={propsForFields.dispense_wells.errorToShow != null}
          />
        )}
      </Flex>
      <Divider marginY="0" />
      <PathField
        {...propsForFields.path}
        aspirate_airGap_checkbox={formData.aspirate_airGap_checkbox}
        aspirate_airGap_volume={formData.aspirate_airGap_volume}
        aspirate_wells={formData.aspirate_wells}
        changeTip={formData.changeTip}
        dispense_wells={formData.dispense_wells}
        pipette={formData.pipette}
        volume={formData.volume}
        tipRack={formData.tipRack}
        isDisposalLocation={isDisposalLocation}
        title={t('pipette_path')}
      />
      <Divider marginY="0" />
      <VolumeField {...propsForFields.volume} />
    </Flex>
  )
}
