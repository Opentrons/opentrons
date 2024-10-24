import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Divider,
  DropdownMenu,
  Flex,
  RadioButton,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  HEATERSHAKER_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  getModuleDisplayName,
} from '@opentrons/shared-data'

import {
  PAUSE_UNTIL_RESUME,
  PAUSE_UNTIL_TEMP,
  PAUSE_UNTIL_TIME,
} from '../../../../../../constants'
import { InputStepFormField } from '../../../../../../molecules'
import { getInitialDeckSetup } from '../../../../../../step-forms/selectors'
import { selectors as uiModuleSelectors } from '../../../../../../ui/modules'

import type { ChangeEvent } from 'react'
import type { StepFormProps } from '../../types'

export function PauseTools(props: StepFormProps): JSX.Element {
  const { propsForFields } = props

  const tempModuleLabwareOptions = useSelector(
    uiModuleSelectors.getTemperatureLabwareOptions
  )
  const { i18n, t } = useTranslation(['tooltip', 'application', 'form'])

  const heaterShakerModuleLabwareOptions = useSelector(
    uiModuleSelectors.getHeaterShakerLabwareOptions
  )

  const { modules } = useSelector(getInitialDeckSetup)
  interface ModuleOption {
    name: string
    value: string
  }
  const modulesOnDeck = Object.values(modules)
  const moduleOptions = modulesOnDeck.reduce<ModuleOption[]>((acc, module) => {
    if (
      [
        TEMPERATURE_MODULE_TYPE as string,
        HEATERSHAKER_MODULE_TYPE as string,
      ].includes(module.type)
    ) {
      const moduleName = getModuleDisplayName(module.model)
      return [
        ...acc,
        { value: module.id, name: `${moduleName} in ${module.slot}` },
      ]
    }
    return acc
  }, [])

  const moduleLabwareOptions = [
    ...tempModuleLabwareOptions,
    ...heaterShakerModuleLabwareOptions,
  ]

  const pauseUntilModuleEnabled = moduleLabwareOptions.length > 0

  const { pauseAction } = props.formData

  return (
    <>
      <Flex flexDirection={DIRECTION_COLUMN}>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing4}
            width="100%"
            padding={`${SPACING.spacing16} ${SPACING.spacing16} 0 ${SPACING.spacing16}`}
          >
            <RadioButton
              onChange={(e: ChangeEvent<any>) => {
                propsForFields.pauseAction.updateValue(e.currentTarget.value)
              }}
              buttonLabel={t(
                'form:step_edit_form.field.pauseAction.options.untilResume'
              )}
              buttonValue={PAUSE_UNTIL_RESUME}
              isSelected={
                propsForFields.pauseAction.value === PAUSE_UNTIL_RESUME
              }
              largeDesktopBorderRadius
            />
            <RadioButton
              onChange={(e: ChangeEvent<any>) => {
                propsForFields.pauseAction.updateValue(e.currentTarget.value)
              }}
              buttonLabel={t(
                'form:step_edit_form.field.pauseAction.options.untilTime'
              )}
              buttonValue={PAUSE_UNTIL_TIME}
              isSelected={propsForFields.pauseAction.value === PAUSE_UNTIL_TIME}
              largeDesktopBorderRadius
            />
            <RadioButton
              onChange={(e: ChangeEvent<any>) => {
                propsForFields.pauseAction.updateValue(e.currentTarget.value)
              }}
              buttonLabel={t(
                'form:step_edit_form.field.pauseAction.options.untilTemperature'
              )}
              buttonValue={PAUSE_UNTIL_TEMP}
              isSelected={propsForFields.pauseAction.value === PAUSE_UNTIL_TEMP}
              largeDesktopBorderRadius
              disabled={!pauseUntilModuleEnabled}
            />
          </Flex>
          <Divider marginY="0" />
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing12}
            paddingX={SPACING.spacing16}
          >
            {pauseAction === PAUSE_UNTIL_TIME ? (
              <Flex
                flexDirection={DIRECTION_COLUMN}
                gridGap={SPACING.spacing12}
              >
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  gridGap={SPACING.spacing4}
                >
                  <InputStepFormField
                    {...propsForFields.pauseTime}
                    title={t('form:step_edit_form.field.pauseAction.duration')}
                    value={propsForFields.pauseTime.value as string}
                    updateValue={propsForFields.pauseTime.updateValue}
                    errorToShow={propsForFields.pauseTime.errorToShow}
                    units={t('application:units.time_hms')}
                    padding="0"
                    showTooltip={false}
                  />
                </Flex>
              </Flex>
            ) : null}
            {pauseAction === PAUSE_UNTIL_TEMP ? (
              <>
                <Flex flexDirection={DIRECTION_COLUMN}>
                  <StyledText desktopStyle="captionRegular">
                    {i18n.format(
                      t('form:step_edit_form.field.moduleActionLabware.label'),
                      'capitalize'
                    )}
                  </StyledText>
                  <DropdownMenu
                    filterOptions={moduleOptions}
                    onClick={value => {
                      propsForFields.moduleId.updateValue(value)
                    }}
                    currentOption={
                      moduleOptions.find(
                        option => option.value === propsForFields.moduleId.value
                      ) ?? { name: '', value: '' }
                    }
                    dropdownType="neutral"
                    width="100%"
                  />
                </Flex>
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  gridGap={SPACING.spacing4}
                >
                  <InputStepFormField
                    {...propsForFields.pauseTemperature}
                    title={t('application:temperature')}
                    updateValue={propsForFields.pauseTemperature.updateValue}
                    errorToShow={propsForFields.pauseTemperature.errorToShow}
                    padding="0"
                    showTooltip={false}
                  />
                </Flex>
              </>
            ) : null}
          </Flex>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing4}
            paddingX={SPACING.spacing16}
          >
            <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
              {i18n.format(
                t('form:step_edit_form.field.pauseMessage.label'),
                'capitalize'
              )}
            </StyledText>
            <StyledTextArea
              value={propsForFields.pauseMessage.value as string}
              onChange={(e: ChangeEvent<any>) => {
                propsForFields.pauseMessage.updateValue(e.currentTarget.value)
              }}
              height="7rem"
            />
          </Flex>
        </Flex>
      </Flex>
    </>
  )
}

const StyledTextArea = styled.textarea<{ height?: string; error?: boolean }>`
  width: 100%;
  height: ${props => (props.height != null ? props.height : '2rem')};
  box-sizing: border-box;
  border: 1px solid
    ${props =>
      props.error != null && props.error ? COLORS.red50 : COLORS.grey50};
  border-radius: ${BORDERS.borderRadius4};
  padding: ${SPACING.spacing8};
  font-size: ${TYPOGRAPHY.fontSizeH4};
  line-height: ${TYPOGRAPHY.lineHeight16};
  font-weight: ${TYPOGRAPHY.fontWeightRegular};
  resize: none;
`
