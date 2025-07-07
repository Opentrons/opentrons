import { useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  Chip,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  InfoScreen,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { ControlledTextAreaField } from '/ai-client/atoms/ControlledTextAreaField'
import {
  OPENTRONS_FLEX,
  ROBOT_FIELD_NAME,
} from '/ai-client/organisms/InstrumentsSection'
import { PROTOCOL_FORMAT, PYTHON } from '/ai-client/resources/constants'

const RUNTIME_PARAMETERS_FIELD_NAME = 'runtime_parameters'

export function RuntimeParametersSection(): JSX.Element | null {
  const { t } = useTranslation('create_protocol')
  const { control } = useFormContext()

  const protocolFormat = useWatch({ control, name: PROTOCOL_FORMAT })

  const robotType = useWatch({ control, name: ROBOT_FIELD_NAME })

  // Only show this section when protocol format is Python and robot type is Flex
  const shouldShowSection =
    protocolFormat === PYTHON && robotType === OPENTRONS_FLEX

  if (!shouldShowSection) {
    return <InfoScreen content={t('runtime_parameters_unavailable')} />
  }

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
