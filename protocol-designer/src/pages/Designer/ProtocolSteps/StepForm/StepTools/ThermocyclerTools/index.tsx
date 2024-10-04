import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Divider,
  Flex,
  RadioButton,
  SPACING,
} from '@opentrons/components'

import { ProfileSettings } from './ProfileSettings'
import { ProfileStepsSummary } from './ProfileStepsSummary'
import { ThermocyclerState } from './ThermocyclerState'

import type { StepFormProps } from '../../types'

type ThermocyclerContentType = 'thermocyclerState' | 'thermocyclerProfile'

export function ThermocyclerTools(props: StepFormProps): JSX.Element {
  const { propsForFields, formData, toolboxStep } = props
  const { t } = useTranslation('form')

  const [contentType, setContentType] = useState<ThermocyclerContentType>(
    (formData.thermocyclerFormType as ThermocyclerContentType) ??
      'thermocyclerState'
  )

  if (toolboxStep === 0) {
    return (
      <Flex
        flexDirection={DIRECTION_COLUMN}
        padding={SPACING.spacing16}
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
            propsForFields.thermocyclerFormType.updateValue('thermocyclerState')
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
          }}
          isSelected={contentType === 'thermocyclerProfile'}
        />
      </Flex>
    )
  } else if (contentType === 'thermocyclerState') {
    return (
      <ThermocyclerState
        title={t('step_edit_form.field.thermocyclerState.state')}
        propsForFields={propsForFields}
        formData={formData}
      />
    )
  } else {
    return (
      <Flex flexDirection={DIRECTION_COLUMN}>
        <ProfileSettings propsForFields={propsForFields} />
        <Divider marginY="0" />
        <ProfileStepsSummary
          propsForFields={propsForFields}
          formData={formData}
        />
        <Divider marginY="0" />
        <ThermocyclerState
          title={t('step_edit_form.field.thermocyclerState.ending_hold')}
          propsForFields={propsForFields}
          formData={formData}
          isHold
        />
      </Flex>
    )
  }
}
