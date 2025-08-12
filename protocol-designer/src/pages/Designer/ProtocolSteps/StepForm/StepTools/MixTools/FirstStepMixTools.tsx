import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Divider,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { InputStepFormField } from '/protocol-designer/components/molecules'

import {
  ChangeTipField,
  DropTipField,
  LabwareField,
  PartialTipField,
  PickUpTipField,
  PipetteField,
  TiprackField,
  TipWellSelectionField,
  VolumeField,
  WellSelectionField,
} from '../../PipetteFields'

import type { PipetteEntities } from '@opentrons/step-generation'
import type { FormData } from '/protocol-designer/form-types'
import type { FieldPropsByName } from '../../types'

interface FirstStepMixToolsProps {
  propsForFields: FieldPropsByName
  formData: FormData
  enablePartialTip: boolean
  pipettes: PipetteEntities
  enableTipPickupLocation: boolean
  userSelectedPickUpTipLocation: boolean
  userSelectedDropTipLocation: boolean
}

export function FirstStepMixTools({
  propsForFields,
  formData,
  enablePartialTip,
  pipettes,
  enableTipPickupLocation,
  userSelectedPickUpTipLocation,
  userSelectedDropTipLocation,
}: FirstStepMixToolsProps): JSX.Element {
  const { t } = useTranslation(['application', 'form', 'protocol_steps'])
  const is96Channel =
    propsForFields.pipette.value != null &&
    pipettes[String(propsForFields.pipette.value)].spec.channels === 96
  const is8Channel =
    propsForFields.pipette.value != null &&
    pipettes[String(propsForFields.pipette.value)].spec.channels === 8
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing12}
      paddingY={SPACING.spacing16}
    >
      <PipetteField {...propsForFields.pipette} />
      {propsForFields.pipette.value != null &&
      (is96Channel || (is8Channel && enablePartialTip)) ? (
        <PartialTipField
          {...propsForFields.nozzles}
          pipetteSpecs={pipettes[String(propsForFields.pipette.value)]?.spec}
        />
      ) : null}
      <Divider marginY="0" />
      <TiprackField
        {...propsForFields.tipRack}
        pipetteId={propsForFields.pipette.value}
      />
      <Divider marginY="0" />
      <LabwareField {...propsForFields.labware} tooltipContent={null} />
      <Divider marginY="0" />
      <WellSelectionField
        {...propsForFields.wells}
        labwareId={formData.labware}
        pipetteId={formData.pipette}
        nozzles={
          typeof propsForFields.nozzles.value === 'string'
            ? propsForFields.nozzles.value
            : null
        }
        hasFormError={propsForFields.wells.errorToShow != null}
      />
      <Divider marginY="0" />
      <VolumeField {...propsForFields.volume} />
      <Divider marginY="0" />
      <InputStepFormField
        {...propsForFields.times}
        units={t('units.times')}
        title={t('protocol_steps:mix_repetitions')}
        showTooltip={false}
      />
      <Divider marginY="0" />
      <Flex
        paddingX={SPACING.spacing16}
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing8}
      >
        <StyledText desktopStyle="bodyDefaultSemiBold">
          {t('protocol_steps:tip_management')}
        </StyledText>
        <ChangeTipField
          {...propsForFields.changeTip}
          aspirateWells={formData.aspirate_wells}
          dispenseWells={formData.dispense_wells}
          path={formData.path}
          stepType={formData.stepType}
          isDisposalLocation={false}
          tooltipContent={null}
          padding="0"
        />
        <DropTipField
          {...propsForFields.dropTip_location}
          nozzles={formData.nozzles}
          tooltipContent={null}
          padding="0"
          tiprackDefUri={formData.tipRack}
        />
      </Flex>
      {enableTipPickupLocation ? (
        <>
          <PickUpTipField {...propsForFields.pickUpTip_location} />
          {userSelectedPickUpTipLocation ? (
            <>
              <Divider marginY="0" />
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
    </Flex>
  )
}
