import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import {
  DIRECTION_COLUMN,
  Divider,
  Flex,
  SPACING,
  StyledText,
  Tabs,
} from '@opentrons/components'
import {
  CheckboxExpandStepFormField,
  InputStepFormField,
} from '../../../../../../molecules'
import {
  getLabwareEntities,
  getPipetteEntities,
} from '../../../../../../step-forms/selectors'
import { getEnableReturnTip } from '../../../../../../feature-flags/selectors'
import {
  BlowoutLocationField,
  BlowoutOffsetField,
  ChangeTipField,
  DropTipField,
  FlowRateField,
  LabwareField,
  PartialTipField,
  PickUpTipField,
  PipetteField,
  PositionField,
  TipWellSelectionField,
  TiprackField,
  VolumeField,
  WellSelectionField,
  WellsOrderField,
} from '../../PipetteFields'
import {
  getBlowoutLocationOptionsForForm,
  getLabwareFieldForPositioningField,
} from '../../utils'
import type { StepFormProps } from '../../types'

export function MixTools(props: StepFormProps): JSX.Element {
  const { propsForFields, formData, toolboxStep, visibleFormErrors } = props
  const pipettes = useSelector(getPipetteEntities)
  const enableReturnTip = useSelector(getEnableReturnTip)
  const labwares = useSelector(getLabwareEntities)
  const [tab, setTab] = useState<'aspirate' | 'dispense'>('aspirate')
  const { t, i18n } = useTranslation(['application', 'form'])
  const aspirateTab = {
    text: i18n.format(t('aspirate'), 'capitalize'),
    isActive: tab === 'aspirate',
    onClick: () => {
      setTab('aspirate')
    },
  }
  const dispenseTab = {
    text: i18n.format(t('dispense'), 'capitalize'),

    isActive: tab === 'dispense',
    onClick: () => {
      setTab('dispense')
    },
  }
  const is96Channel =
    propsForFields.pipette.value != null &&
    pipettes[String(propsForFields.pipette.value)].name === 'p1000_96'
  const userSelectedPickUpTipLocation =
    labwares[String(propsForFields.pickUpTip_location.value)] != null
  const userSelectedDropTipLocation =
    labwares[String(propsForFields.dropTip_location.value)] != null

  return toolboxStep === 0 ? (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <PipetteField {...propsForFields.pipette} />
      {is96Channel ? <PartialTipField {...propsForFields.nozzles} /> : null}
      <Divider marginY="0" />
      <TiprackField
        {...propsForFields.tipRack}
        pipetteId={propsForFields.pipette.value}
      />
      <Divider marginY="0" />
      <LabwareField {...propsForFields.labware} />
      <Divider marginY="0" />
      <Divider marginY="0" />
      <WellSelectionField
        {...propsForFields.wells}
        labwareId={formData.labware}
        pipetteId={formData.pipette}
        nozzles={String(propsForFields.nozzles.value) ?? null}
        hasFormError={
          visibleFormErrors?.some(error =>
            error.dependentFields.includes('labware')
          ) ?? false
        }
      />
      <Divider marginY="0" />
      <VolumeField {...propsForFields.volume} />
      <Divider marginY="0" />
      <InputStepFormField
        {...propsForFields.times}
        units={t('units.times')}
        title={t('protocol_steps:mix_repetitions')}
      />
      <Divider marginY="0" />
      <ChangeTipField
        {...propsForFields.changeTip}
        aspirateWells={formData.aspirate_wells}
        dispenseWells={formData.dispense_wells}
        path={formData.path}
        stepType={formData.stepType}
      />
      <Divider marginY="0" />
      {enableReturnTip ? (
        <>
          <PickUpTipField {...propsForFields.pickUpTip_location} />
          {userSelectedPickUpTipLocation ? (
            <>
              <Divider marginY="0" />
              <TipWellSelectionField
                {...propsForFields.pickUpTip_wellNames}
                nozzles={String(propsForFields.nozzles.value) ?? null}
                labwareId={propsForFields.pickUpTip_location.value}
                pipetteId={propsForFields.pipette.value}
              />
            </>
          ) : null}
        </>
      ) : null}
      <Divider marginY="0" />
      <DropTipField {...propsForFields.dropTip_location} />
      {userSelectedDropTipLocation && enableReturnTip ? (
        <>
          <Divider marginY="0" />
          <TipWellSelectionField
            {...propsForFields.dropTip_wellNames}
            nozzles={String(propsForFields.nozzles.value) ?? null}
            labwareId={propsForFields.dropTip_location.value}
            pipetteId={propsForFields.pipette.value}
          />
        </>
      ) : null}
    </Flex>
  ) : (
    <Flex flexDirection={DIRECTION_COLUMN} width="100%">
      <Flex padding={SPACING.spacing16}>
        <Tabs tabs={[aspirateTab, dispenseTab]} />
      </Flex>
      <Divider marginY="0" />
      <Flex padding={SPACING.spacing16} width="100%">
        <FlowRateField
          {...propsForFields[`${tab}_flowRate`]}
          pipetteId={formData.pipette}
          flowRateType={tab}
          volume={propsForFields.volume?.value ?? 0}
          tiprack={propsForFields.tipRack.value}
        />
      </Flex>
      <Divider marginY="0" />
      {tab === 'aspirate' ? (
        <>
          <WellsOrderField
            prefix={tab}
            updateFirstWellOrder={
              propsForFields.mix_wellOrder_first.updateValue
            }
            updateSecondWellOrder={
              propsForFields.mix_wellOrder_second.updateValue
            }
            firstValue={formData.mix_wellOrder_first}
            secondValue={formData.mix_wellOrder_second}
            firstName={'mix_wellOrder_first'}
            secondName={'mix_wellOrder_second'}
          />
          <Divider marginY="0" />
          <PositionField
            prefix="mix"
            propsForFields={propsForFields}
            zField="mix_mmFromBottom"
            xField="mix_x_position"
            yField="mix_y_position"
            labwareId={
              formData[getLabwareFieldForPositioningField('mix_mmFromBottom')]
            }
          />
          <Divider marginY="0" />
        </>
      ) : null}
      <Flex
        flexDirection={DIRECTION_COLUMN}
        padding={SPACING.spacing12}
        gridGap={SPACING.spacing8}
      >
        <StyledText desktopStyle="bodyDefaultSemiBold">
          {t('protocol_steps:advanced_settings')}
        </StyledText>
        <CheckboxExpandStepFormField
          title={i18n.format(
            t('form:step_edit_form.field.delay.label'),
            'capitalize'
          )}
          checkboxValue={propsForFields[`${tab}_delay_checkbox`].value}
          isChecked={propsForFields[`${tab}_delay_checkbox`].value === true}
          checkboxUpdateValue={
            propsForFields[`${tab}_delay_checkbox`].updateValue
          }
        >
          {formData[`${tab}_delay_checkbox`] === true ? (
            <InputStepFormField
              showTooltip={false}
              padding="0"
              title={t('protocol_steps:delay_duration')}
              {...propsForFields[`${tab}_delay_seconds`]}
              units={t('application:units.seconds')}
            />
          ) : null}
        </CheckboxExpandStepFormField>
        {tab === 'dispense' ? (
          <>
            <CheckboxExpandStepFormField
              title={i18n.format(
                t('form:step_edit_form.field.blowout.label'),
                'capitalize'
              )}
              checkboxValue={propsForFields.blowout_checkbox.value}
              isChecked={propsForFields.blowout_checkbox.value === true}
              checkboxUpdateValue={propsForFields.blowout_checkbox.updateValue}
            >
              {formData.blowout_checkbox === true ? (
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  gridGap={SPACING.spacing6}
                >
                  <BlowoutLocationField
                    {...propsForFields.blowout_location}
                    options={getBlowoutLocationOptionsForForm({
                      stepType: formData.stepType,
                    })}
                  />
                  <FlowRateField
                    {...propsForFields.blowout_flowRate}
                    pipetteId={formData.pipette}
                    flowRateType="blowout"
                    volume={propsForFields.volume?.value ?? 0}
                    tiprack={propsForFields.tipRack.value}
                  />
                  <BlowoutOffsetField
                    {...propsForFields.blowout_z_offset}
                    destLabwareId={propsForFields.labware.value}
                    blowoutLabwareId={propsForFields.blowout_location.value}
                  />
                </Flex>
              ) : null}
            </CheckboxExpandStepFormField>
            <CheckboxExpandStepFormField
              title={i18n.format(
                t('form:step_edit_form.field.touchTip.label'),
                'capitalize'
              )}
              checkboxValue={propsForFields.mix_touchTip_checkbox.value}
              isChecked={propsForFields.mix_touchTip_checkbox.value === true}
              checkboxUpdateValue={
                propsForFields.mix_touchTip_checkbox.updateValue
              }
            >
              {formData.mix_touchTip_checkbox === true ? (
                <PositionField
                  prefix={tab}
                  propsForFields={propsForFields}
                  zField="mix_touchTip_mmFromBottom"
                  labwareId={
                    formData[
                      getLabwareFieldForPositioningField(
                        'mix_touchTip_mmFromBottom'
                      )
                    ]
                  }
                />
              ) : null}
            </CheckboxExpandStepFormField>
          </>
        ) : null}
      </Flex>
    </Flex>
  )
}
