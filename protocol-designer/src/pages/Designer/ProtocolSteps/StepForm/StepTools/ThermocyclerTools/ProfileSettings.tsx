import { useTranslation } from 'react-i18next'
import {
  Flex,
  DIRECTION_COLUMN,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { InputStepFormField } from '../../../../../../molecules'

import type { FieldPropsByName } from '../../types'

interface ProfileSettingsProps {
  propsForFields: FieldPropsByName
}
export function ProfileSettings(props: ProfileSettingsProps): JSX.Element {
  const { propsForFields } = props
  const { i18n, t } = useTranslation(['application', 'form'])
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing12}
      padding={SPACING.spacing16}
    >
      <StyledText desktopStyle="bodyDefaultSemiBold">
        {i18n.format(t('stepType.profile_settings'), 'capitalize')}
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
