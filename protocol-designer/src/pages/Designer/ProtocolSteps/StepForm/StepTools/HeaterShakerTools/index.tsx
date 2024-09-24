import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  Box,
  Btn,
  COLORS,
  Check,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  ListItem,
  SPACING,
  StyledText,
  TOOLTIP_BOTTOM,
  Tooltip,
  useHoverTooltip,
} from '@opentrons/components'
import { getHeaterShakerLabwareOptions } from '../../../../../../ui/modules/selectors'
import {
  DropdownStepFormField,
  InputStepFormField,
} from '../../../../../../molecules'
import { Toggle } from '../../../../../../atoms'
import type { StepFormProps } from '../../types'

export function HeaterShakerTools(props: StepFormProps): JSX.Element {
  const { propsForFields, formData } = props
  const { t } = useTranslation(['application', 'form', 'protocol_steps'])
  const moduleLabwareOptions = useSelector(getHeaterShakerLabwareOptions)
  const [targetLatchProps, tooltipLatchProps] = useHoverTooltip({
    placement: TOOLTIP_BOTTOM,
  })

  useEffect(() => {
    if (moduleLabwareOptions.length === 1) {
      propsForFields.moduleId.updateValue(moduleLabwareOptions[0].value)
    }
  }, [])

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      {moduleLabwareOptions.length > 1 ? (
        <DropdownStepFormField
          {...propsForFields.moduleId}
          options={moduleLabwareOptions}
          title={t('protocol_steps:module')}
        />
      ) : (
        <Flex
          flexDirection={DIRECTION_COLUMN}
          padding={SPACING.spacing12}
          gridGap={SPACING.spacing8}
        >
          <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
            {t('protocol_steps:module')}
          </StyledText>
          <ListItem type="noActive">
            <Flex padding={SPACING.spacing12}>
              <StyledText desktopStyle="bodyDefaultRegular">
                {moduleLabwareOptions[0].name}
              </StyledText>
            </Flex>
          </ListItem>
        </Flex>
      )}
      <Box borderBottom={`1px solid ${COLORS.grey30}`} />
      <Flex
        flexDirection={DIRECTION_COLUMN}
        padding={SPACING.spacing12}
        gridGap={SPACING.spacing8}
      >
        <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
          {t('protocol_steps:heater_shaker_settings')}
        </StyledText>
        <ListItem type="noActive">
          <Flex
            padding={SPACING.spacing12}
            width="100%"
            flexDirection={DIRECTION_COLUMN}
          >
            <Flex
              justifyContent={JUSTIFY_SPACE_BETWEEN}
              alignItems={ALIGN_CENTER}
            >
              <StyledText desktopStyle="bodyDefaultRegular">
                {t(
                  'form:step_edit_form.field.heaterShaker.temperature.setTemperature'
                )}
              </StyledText>
              <Toggle
                onClick={() => {
                  propsForFields.setHeaterShakerTemperature.updateValue(
                    !propsForFields.setHeaterShakerTemperature.value
                  )
                }}
                label={
                  propsForFields.setHeaterShakerTemperature.value === true
                    ? t(
                        'form:step_edit_form.field.heaterShaker.temperature.toggleOn'
                      )
                    : t(
                        'form:step_edit_form.field.heaterShaker.temperature.toggleOff'
                      )
                }
                isSelected={
                  propsForFields.setHeaterShakerTemperature.value === true
                }
              />
            </Flex>
            {formData.setHeaterShakerTemperature === true ? (
              <InputStepFormField
                padding="0"
                showTooltip={false}
                title={t('protocol_steps:temperature')}
                {...propsForFields.targetHeaterShakerTemperature}
                units={t('units.degrees')}
              />
            ) : null}
          </Flex>
        </ListItem>
        <ListItem type="noActive">
          <Flex
            padding={SPACING.spacing12}
            width="100%"
            flexDirection={DIRECTION_COLUMN}
          >
            <Flex
              justifyContent={JUSTIFY_SPACE_BETWEEN}
              alignItems={ALIGN_CENTER}
            >
              <StyledText desktopStyle="bodyDefaultRegular">
                {t('form:step_edit_form.field.heaterShaker.shaker.setShake')}
              </StyledText>
              <Toggle
                onClick={() => {
                  propsForFields.setShake.updateValue(
                    !propsForFields.setShake.value
                  )
                }}
                label={
                  propsForFields.setShake.value === true
                    ? t(
                        'form:step_edit_form.field.heaterShaker.shaker.toggleOn'
                      )
                    : t(
                        'form:step_edit_form.field.heaterShaker.shaker.toggleOff'
                      )
                }
                isSelected={propsForFields.setShake.value === true}
              />
            </Flex>
            {formData.setShake === true ? (
              <InputStepFormField
                showTooltip={false}
                padding="0"
                title={t('protocol_steps:shake')}
                {...propsForFields.targetSpeed}
                units={t('units.rpm')}
              />
            ) : null}
          </Flex>
        </ListItem>
        <ListItem type="noActive">
          <Flex
            padding={SPACING.spacing12}
            width="100%"
            flexDirection={DIRECTION_COLUMN}
          >
            <Flex
              justifyContent={JUSTIFY_SPACE_BETWEEN}
              alignItems={ALIGN_CENTER}
              {...targetLatchProps}
            >
              <StyledText desktopStyle="bodyDefaultRegular">
                {t('form:step_edit_form.field.heaterShaker.latch.setLatch')}
              </StyledText>
              <Toggle
                disabled={propsForFields.latchOpen.disabled}
                onClick={() => {
                  propsForFields.latchOpen.updateValue(
                    !propsForFields.latchOpen.value
                  )
                }}
                label={
                  propsForFields.latchOpen.value === true
                    ? t('form:step_edit_form.field.heaterShaker.latch.toggleOn')
                    : t(
                        'form:step_edit_form.field.heaterShaker.latch.toggleOff'
                      )
                }
                isSelected={propsForFields.latchOpen.value === true}
              />
            </Flex>
          </Flex>
        </ListItem>
        <ListItem type="noActive">
          <Flex
            padding={SPACING.spacing12}
            width="100%"
            flexDirection={DIRECTION_COLUMN}
          >
            <Flex
              justifyContent={JUSTIFY_SPACE_BETWEEN}
              alignItems={ALIGN_CENTER}
            >
              <StyledText desktopStyle="bodyDefaultRegular">
                {t(
                  'form:step_edit_form.field.heaterShaker.timer.heaterShakerSetTimer'
                )}
              </StyledText>
              <Btn
                onClick={() => {
                  propsForFields.heaterShakerSetTimer.updateValue(
                    !propsForFields.heaterShakerSetTimer.value
                  )
                }}
              >
                <Check
                  color={COLORS.blue50}
                  isChecked={propsForFields.heaterShakerSetTimer.value === true}
                />
              </Btn>
            </Flex>
            {/* TODO: wire up the new timer with the combined field */}
            {formData.heaterShakerSetTimer === true ? (
              <InputStepFormField
                showTooltip={false}
                padding="0"
                title={t('protocol_steps:time')}
                {...propsForFields.heaterShakerTimerMinutes}
                units="HH:MM:SS"
              />
            ) : null}
          </Flex>
        </ListItem>
        {propsForFields.latchOpen.disabled && (
          <Tooltip tooltipProps={tooltipLatchProps}>
            {propsForFields.latchOpen.tooltipContent}
          </Tooltip>
        )}
      </Flex>
    </Flex>
  )
}
