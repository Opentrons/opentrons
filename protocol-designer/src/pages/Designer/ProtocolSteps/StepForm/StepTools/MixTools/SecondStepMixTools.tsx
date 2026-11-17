import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  DIRECTION_COLUMN,
  Divider,
  Flex,
  SPACING,
  StyledText,
  Tabs,
} from '@opentrons/components'
import { getMaxPushOutVolume } from '@opentrons/shared-data'

import {
  CheckboxExpandStepFormField,
  InputStepFormField,
} from '/protocol-designer/components/molecules'
import { ResetSettingsModal } from '/protocol-designer/components/organisms/ResetSettingsModal'
import { getRobotType } from '/protocol-designer/file-data/selectors'
import { getLabwareDefsByURI } from '/protocol-designer/labware-defs/selectors'

import {
  getAdditionalEquipmentEntities,
  getPipetteEntities,
} from '../../../../../../step-forms/selectors'
import { updateFieldsForLiquidClass } from '../../../../../../steplist/formLevel/handleFormChange/utils'
import {
  BlowoutLocationField,
  BlowoutOffsetField,
  FlowRateField,
  PositionField,
  WellsOrderField,
} from '../../PipetteFields'
import {
  getBlowoutLocationOptionsForForm,
  getLabwareFieldForPositioningField,
} from '../../utils'
import { ResetSettingsField } from '../MoveLiquidTools/ResetSettingsField'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type { FormData } from '/protocol-designer/form-types'
import type { FieldPropsByName, LiquidHandlingTab } from '../../types'

interface SecondStepMixToolsProps {
  propsForFields: FieldPropsByName
  formData: FormData
  tab: LiquidHandlingTab
  setTab: Dispatch<SetStateAction<LiquidHandlingTab>>
}

// ToDo (kk:03/24/2025) component name might be changed
export function SecondStepMixTools({
  propsForFields,
  formData,
  tab,
  setTab,
}: SecondStepMixToolsProps): ReactNode {
  const { t, i18n } = useTranslation(['application', 'form'])
  const toolsComponentRef = useRef<HTMLDivElement | null>(null)
  const pipetteEntities = useSelector(getPipetteEntities)
  const additionalEquipmentEntities = useSelector(
    getAdditionalEquipmentEntities
  )
  const allLabwareDefs = useSelector(getLabwareDefsByURI)
  const robotType = useSelector(getRobotType)
  const [showResetModal, setShowResetModal] = useState<boolean>(false)
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

  const handleScrollToTop = (): void => {
    if (toolsComponentRef.current != null) {
      toolsComponentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }

  const pipetteSpec = useSelector(getPipetteEntities)[formData.pipette]?.spec
  const maxPushoutVolume = getMaxPushOutVolume(
    Number(formData.volume),
    pipetteSpec
  )

  return (
    <>
      {showResetModal ? (
        <ResetSettingsModal
          tab={tab}
          onContinue={() => {
            updateFieldsForLiquidClass({
              propsForFields,
              rawForm: formData,
              pipetteEntities,
              additionalEquipmentEntities,
              allLabwareDefs,
              liquidHandlingAction: tab,
              robotType,
            })
          }}
          onClose={() => {
            setShowResetModal(false)
          }}
          onScroll={() => {
            handleScrollToTop()
          }}
          liquidClass={formData.liquidClass}
        />
      ) : null}
      <Flex
        ref={toolsComponentRef}
        flexDirection={DIRECTION_COLUMN}
        width="100%"
        paddingY={SPACING.spacing16}
        gridGap={SPACING.spacing12}
      >
        <Flex padding={`0 ${SPACING.spacing16}`}>
          <Tabs tabs={[aspirateTab, dispenseTab]} />
        </Flex>
        <Divider marginY="0" />
        <FlowRateField
          key={`${tab}_flowRate`}
          {...propsForFields[`${tab}_flowRate`]}
          pipetteId={formData.pipette}
          flowRateType={tab}
          volume={propsForFields.volume?.value ?? 0}
          tiprack={propsForFields.tipRack.value}
          formData={formData}
        />
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
              firstName="mix_wellOrder_first"
              secondName="mix_wellOrder_second"
            />
            <Divider marginY="0" />
            <PositionField
              formData={formData}
              prefix="mix"
              propsForFields={propsForFields}
              zField="mix_mmFromBottom"
              xField="mix_x_position"
              yField="mix_y_position"
              referenceField="mix_position_reference"
              labwareId={
                formData[getLabwareFieldForPositioningField('mix_mmFromBottom')]
              }
            />
            <Divider marginY="0" />
          </>
        ) : null}
        <Flex
          flexDirection={DIRECTION_COLUMN}
          padding={`0 ${SPACING.spacing16}`}
          gridGap={SPACING.spacing4}
        >
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {t('protocol_steps:advanced_settings')}
          </StyledText>
          <CheckboxExpandStepFormField
            title={i18n.format(
              t('form:step_edit_form.field.delay.label'),
              'capitalize'
            )}
            testId="delay_checkbox"
            fieldProps={propsForFields[`${tab}_delay_checkbox`]}
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
                  t('form:step_edit_form.field.pushOut.title'),
                  'capitalize'
                )}
                fieldProps={propsForFields.pushOut_checkbox}
              >
                {formData.pushOut_checkbox === true ? (
                  <InputStepFormField
                    showTooltip={false}
                    padding="0"
                    title={t(
                      'form:step_edit_form.field.pushOut.pushOut_volume.label'
                    )}
                    caption={t(
                      'form:step_edit_form.field.pushOut.pushOut_volume.caption',
                      { min: 0, max: maxPushoutVolume }
                    )}
                    {...propsForFields.pushOut_volume}
                    units={t('application:units.microliter')}
                  />
                ) : null}
              </CheckboxExpandStepFormField>
              <CheckboxExpandStepFormField
                title={i18n.format(
                  t('form:step_edit_form.field.blowout.label'),
                  'capitalize'
                )}
                testId="blowout_checkbox"
                fieldProps={propsForFields.blowout_checkbox}
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
                      padding="0"
                    />
                    <FlowRateField
                      key="blowout_flowRate"
                      {...propsForFields.blowout_flowRate}
                      pipetteId={formData.pipette}
                      flowRateType="blowout"
                      volume={propsForFields.volume?.value ?? 0}
                      tiprack={propsForFields.tipRack.value}
                      formData={formData}
                      padding="0"
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
                testId="touchTip_checkbox"
                fieldProps={propsForFields.mix_touchTip_checkbox}
              >
                {formData.mix_touchTip_checkbox === true ? (
                  <PositionField
                    formData={formData}
                    prefix={tab}
                    propsForFields={propsForFields}
                    zField="mix_touchTip_mmFromTop"
                    labwareId={
                      formData[
                        getLabwareFieldForPositioningField(
                          'mix_touchTip_mmFromTop'
                        )
                      ]
                    }
                  />
                ) : null}
              </CheckboxExpandStepFormField>
            </>
          ) : null}
        </Flex>
        <ResetSettingsField
          tab={tab}
          onClick={() => {
            setShowResetModal(true)
          }}
        />
      </Flex>
    </>
  )
}
