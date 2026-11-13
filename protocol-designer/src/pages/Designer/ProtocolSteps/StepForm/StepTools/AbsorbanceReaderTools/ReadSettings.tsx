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

interface ReadSettingsProps {
  propsForFields: FieldPropsByName
}

export function ReadSettings(props: ReadSettingsProps): ReactNode {
  const { propsForFields } = props

  const { t } = useTranslation('form')
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      paddingX={SPACING.spacing16}
      gridGap={SPACING.spacing12}
      width="100%"
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <StyledText desktopStyle="bodyDefaultSemiBold">
          {t('step_edit_form.absorbanceReader.export_settings.title')}
        </StyledText>
        <StyledText desktopStyle="bodyDefaultRegular">
          {t('step_edit_form.absorbanceReader.export_settings.description')}
        </StyledText>
      </Flex>
      <InputStepFormField
        padding="0"
        {...propsForFields.fileName}
        title={t('step_edit_form.field.absorbanceReader.fileName')}
        showTooltip={false}
      />
    </Flex>
  )
}
