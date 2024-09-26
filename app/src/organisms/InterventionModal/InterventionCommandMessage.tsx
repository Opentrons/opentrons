import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  RESPONSIVENESS,
  SPACING,
  LegacyStyledText,
  TEXT_TRANSFORM_CAPITALIZE,
  TEXT_TRANSFORM_UPPERCASE,
  TYPOGRAPHY,
} from '@opentrons/components'

const INTERVENTION_COMMAND_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  grid-gap: ${SPACING.spacing4};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    grid-gap: 0;
  }
`

const INTERVENTION_COMMAND_NOTES_STYLE = css`
  ${TYPOGRAPHY.h6Default}
  color: ${COLORS.grey60};
  text-transform: ${TEXT_TRANSFORM_UPPERCASE};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    ${TYPOGRAPHY.smallBodyTextBold}
    color: ${COLORS.black90};
    text-transform: ${TEXT_TRANSFORM_CAPITALIZE};
  }
`

const INTERVENTION_COMMAND_MESSAGE_STYLE = css`
  ${TYPOGRAPHY.pRegular}
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    ${TYPOGRAPHY.smallBodyTextRegular}
  }
`

export interface InterventionCommandMessageProps {
  commandMessage: string | null
}

export function InterventionCommandMessage({
  commandMessage,
}: InterventionCommandMessageProps): JSX.Element {
  const { t } = useTranslation('protocol_command_text')

  return (
    <Flex css={INTERVENTION_COMMAND_STYLE}>
      <LegacyStyledText css={INTERVENTION_COMMAND_NOTES_STYLE}>
        {t('notes')}
      </LegacyStyledText>
      <LegacyStyledText css={INTERVENTION_COMMAND_MESSAGE_STYLE}>
        {commandMessage != null && commandMessage !== ''
          ? commandMessage.length > 220
            ? `${commandMessage.substring(0, 217)}...`
            : commandMessage
          : t('wait_for_resume')}
      </LegacyStyledText>
    </Flex>
  )
}
