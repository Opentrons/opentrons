import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  RESPONSIVENESS,
  SPACING,
  TYPOGRAPHY,
  useInterval,
  LegacyStyledText,
} from '@opentrons/components'

import { EMPTY_TIMESTAMP } from '/app/resources/runs'
import { formatInterval } from '/app/transformations/commands'
import { InterventionCommandMessage } from './InterventionCommandMessage'

const PAUSE_INTERVENTION_CONTENT_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  grid-gap: ${SPACING.spacing12};
  width: 100%;
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    grid-gap: ${SPACING.spacing20};
  }
`

export interface PauseContentProps {
  startedAt: string | null
  message: string | null
}

export function PauseInterventionContent({
  startedAt,
  message,
}: PauseContentProps): JSX.Element {
  return (
    <Flex css={PAUSE_INTERVENTION_CONTENT_STYLE}>
      <PauseHeader startedAt={startedAt} />
      <InterventionCommandMessage commandMessage={message} />
    </Flex>
  )
}

const PAUSE_HEADER_STYLE = css`
  align-items: ${ALIGN_CENTER};
  background-color: ${COLORS.grey10};
  border-radius: ${BORDERS.borderRadius4};
  grid-gap: ${SPACING.spacing6};
  padding: ${SPACING.spacing16};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    align-self: ${ALIGN_CENTER};
    background-color: ${COLORS.grey35};
    border-radius: ${BORDERS.borderRadius8};
    grid-gap: ${SPACING.spacing32};
    padding: ${SPACING.spacing24};
    min-width: 36.5rem;
  }
`

const PAUSE_TEXT_STYLE = css`
  ${TYPOGRAPHY.h1Default}
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    ${TYPOGRAPHY.level4HeaderSemiBold}
  }
`

const PAUSE_TIME_STYLE = css`
  ${TYPOGRAPHY.h1Default}
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    ${TYPOGRAPHY.level1Header}
  }
`

interface PauseHeaderProps {
  startedAt: string | null
}

function PauseHeader({ startedAt }: PauseHeaderProps): JSX.Element {
  const { t, i18n } = useTranslation('run_details')
  const [now, setNow] = useState(Date())
  useInterval(
    () => {
      setNow(Date())
    },
    500,
    true
  )

  const runTime =
    startedAt != null ? formatInterval(startedAt, now) : EMPTY_TIMESTAMP

  return (
    <Flex css={PAUSE_HEADER_STYLE}>
      <LegacyStyledText css={PAUSE_TEXT_STYLE}>
        {i18n.format(t('paused_for'), 'capitalize')}
      </LegacyStyledText>
      <LegacyStyledText css={PAUSE_TIME_STYLE}>{runTime}</LegacyStyledText>
    </Flex>
  )
}
