import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  COLORS,
  DIRECTION_COLUMN,
  Divider,
  Flex,
  RadioButton,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { THERMOCYCLER_MODULE_TYPE } from '@opentrons/shared-data'

import { getEnableConcurrentModuleActions } from '/protocol-designer/feature-flags/selectors'

import { usePriorModuleState } from '../../hooks/usePriorModuleState'
import { PriorThermocyclerState } from './PriorThermocyclerState'
import { ProfileSettings } from './ProfileSettings'
import { ProfileStepsSummary } from './ProfileStepsSummary'
import { ThermocyclerState } from './ThermocyclerState'

import type { ReactNode } from 'react'
import type { StepFormProps } from '../../types'

type ThermocyclerContentType = 'thermocyclerState' | 'thermocyclerProfile'

export function ThermocyclerTools(props: StepFormProps): ReactNode {
  const {
    propsForFields,
    formData,
    toolboxStep,
    showFormErrors = true,
    focusedField,
    setShowFormErrors,
  } = props
  const { t } = useTranslation(['form', 'application', 'protocol_steps'])
  const [contentType, setContentType] = useState<ThermocyclerContentType>(
    formData.thermocyclerFormType as ThermocyclerContentType
  )
  const priorState = usePriorModuleState(
    propsForFields.moduleId?.value as string | null,
    THERMOCYCLER_MODULE_TYPE
  )
  const enableConcurrentModuleActions = useSelector(
    getEnableConcurrentModuleActions
  )

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing12}
      paddingY={SPACING.spacing16}
    >
      {enableConcurrentModuleActions && priorState !== null && (
        <>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing8}
            paddingX={SPACING.spacing16}
          >
            <StyledText
              desktopStyle="bodyDefaultSemiBold"
              color={COLORS.black90}
            >
              {t('protocol_steps:prior_state')}
            </StyledText>
            <PriorThermocyclerState priorState={priorState} />
          </Flex>
          <Divider marginY="0" />
        </>
      )}

      {toolboxStep === 0 && (
        <Flex
          flexDirection={DIRECTION_COLUMN}
          paddingX={SPACING.spacing16}
          gridGap={SPACING.spacing4}
        >
          <RadioButton
            buttonLabel={t(
              'step_edit_form.field.thermocyclerAction.options.state'
            )}
            buttonValue="thermocyclerState"
            largeDesktopBorderRadius
            onChange={() => {
              setContentType('thermocyclerState')
              propsForFields.thermocyclerFormType.updateValue(
                'thermocyclerState'
              )
              setShowFormErrors?.(false)
            }}
            isSelected={contentType === 'thermocyclerState'}
          />
          <RadioButton
            buttonLabel={t(
              'step_edit_form.field.thermocyclerAction.options.profile'
            )}
            buttonValue="thermocyclerProfile"
            largeDesktopBorderRadius
            onChange={() => {
              setContentType('thermocyclerProfile')
              propsForFields.thermocyclerFormType.updateValue(
                'thermocyclerProfile'
              )
              setShowFormErrors?.(false)
            }}
            isSelected={contentType === 'thermocyclerProfile'}
          />
        </Flex>
      )}

      {toolboxStep !== 0 && contentType === 'thermocyclerState' && (
        <ThermocyclerState
          title={t('step_edit_form.field.thermocyclerState.state')}
          propsForFields={propsForFields}
          formData={formData}
          showFormErrors={showFormErrors}
          focusedField={focusedField}
        />
      )}

      {toolboxStep !== 0 && contentType !== 'thermocyclerState' && (
        <>
          <ProfileSettings
            propsForFields={propsForFields}
            showFormErrors={showFormErrors}
            focusedField={focusedField}
          />
          <Divider marginY="0" />
          <ProfileStepsSummary
            propsForFields={propsForFields}
            formData={formData}
          />
        </>
      )}
    </Flex>
  )
}
