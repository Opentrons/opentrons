import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  ListItem,
  RadioButton,
  SPACING,
  StyledText,
} from '@opentrons/components'
import {
  getTemperatureLabwareOptions,
  getTemperatureModuleIds,
} from '../../../../../../ui/modules/selectors'
import {
  DropdownStepFormField,
  InputStepFormField,
} from '../../../../../../molecules'
import type { StepFormProps } from '../../types'

export function TemperatureTools(props: StepFormProps): JSX.Element {
  const { propsForFields, formData } = props
  const { t } = useTranslation(['application', 'form', 'protocol_steps'])
  const moduleLabwareOptions = useSelector(getTemperatureLabwareOptions)
  const temperatureModuleIds = useSelector(getTemperatureModuleIds)
  const { setTemperature, moduleId } = formData

  React.useEffect(() => {
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
      {temperatureModuleIds != null
        ? temperatureModuleIds.map(id =>
            id === moduleId ? (
              <Flex
                key={id}
                flexDirection={DIRECTION_COLUMN}
                gridGap={SPACING.spacing4}
              >
                <Flex padding={`${SPACING.spacing16} ${SPACING.spacing16} 0`}>
                  <RadioButton
                    width="100%"
                    largeDesktopBorderRadius
                    onChange={(e: React.ChangeEvent<any>) => {
                      propsForFields.setTemperature.updateValue(
                        e.currentTarget.value
                      )
                    }}
                    buttonLabel={t(
                      'form:step_edit_form.field.setTemperature.options.true'
                    )}
                    buttonValue="true"
                    isSelected={propsForFields.setTemperature.value === 'true'}
                  />
                </Flex>
                {setTemperature === 'true' && (
                  <InputStepFormField
                    {...propsForFields.targetTemperature}
                    title={'Temperature'}
                    units={t('units.degrees')}
                  />
                )}
                <Flex padding={`0 ${SPACING.spacing16}`} width="100%">
                  <RadioButton
                    width="100%"
                    largeDesktopBorderRadius
                    onChange={(e: React.ChangeEvent<any>) => {
                      propsForFields.setTemperature.updateValue(
                        e.currentTarget.value
                      )
                    }}
                    buttonLabel={t(
                      'form:step_edit_form.field.setTemperature.options.false'
                    )}
                    buttonValue="false"
                    isSelected={propsForFields.setTemperature.value === 'false'}
                  />
                </Flex>
              </Flex>
            ) : null
          )
        : null}
    </Flex>
  )
}
