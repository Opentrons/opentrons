import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { InputStepFormField } from '/protocol-designer/components/molecules'

import type { ReactNode } from 'react'
import type { FieldPropsByName } from '../../types'

interface ProfileSettingsProps {
  propsForFields: FieldPropsByName
  showFormErrors: boolean
  focusedField?: string | null
}
export function ProfileSettings(props: ProfileSettingsProps): ReactNode {
  const { propsForFields } = props

  const { t } = useTranslation(['application', 'form'])
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing12}
      padding={`0 ${SPACING.spacing16}`}
    >
      <StyledText desktopStyle="bodyDefaultSemiBold">
        {t('stepType.profile')}
      </StyledText>
      <InputStepFormField
        {...propsForFields.profileVolume}
        title={t('form:step_edit_form.field.thermocyclerProfile.well_volume')}
        units={t('units.microliter')}
        padding="0"
        showTooltip={false}
      />
      <InputStepFormField
        {...propsForFields.profileTargetLidTemp}
        title={t('form:step_edit_form.field.thermocyclerState.lid.temperature')}
        caption={t(
          'form:step_edit_form.field.thermocyclerState.lid.valid_range'
        )}
        units={t('units.degrees')}
        padding="0"
        showTooltip={false}
      />
    </Flex>
  )
}
