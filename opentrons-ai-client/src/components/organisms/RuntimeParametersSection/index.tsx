import { useTranslation } from 'react-i18next'

import {
  Chip,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { ControlledTextAreaField } from '/ai-client/components/atoms/ControlledTextAreaField'

const RUNTIME_PARAMETERS_FIELD_NAME = 'runtime_parameters'

export function RuntimeParametersSection(): JSX.Element {
  const { t } = useTranslation('create_protocol')

  return (
    <Flex
      data-testid="RuntimeParametersSection_inputArea"
      flexDirection={DIRECTION_COLUMN}
      height="100%"
      gap={SPACING.spacing16}
    >
      <Flex>
        <Chip
          text={t('optional')}
          type="neutral"
          background={true}
          chipSize="medium"
          hasIcon={false}
        />
      </Flex>
      <StyledText color={COLORS.grey60} desktopStyle="bodyDefaultRegular">
        {t('runtime_parameters_section_textbody')}
      </StyledText>

      <ControlledTextAreaField
        name={RUNTIME_PARAMETERS_FIELD_NAME}
        title={t('define_runtime_parameters')}
        caption={t('runtime_parameters_example')}
        height="100px"
      />
    </Flex>
  )
}
