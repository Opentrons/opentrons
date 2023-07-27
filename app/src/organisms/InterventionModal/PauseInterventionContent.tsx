import * as React from 'react'
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
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { EMPTY_TIMESTAMP } from '../Devices/constants'
import { formatInterval } from '../RunTimeControl/utils'
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
  background-color: ${COLORS.fundamentalsBackground};
  border-radius: ${BORDERS.radiusSoftCorners};
  grid-gap: ${SPACING.spacing6};
  padding: ${SPACING.spacing16};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    align-self: ${ALIGN_CENTER};
    background-color: ${COLORS.light1};
    border-radius: ${BORDERS.borderRadiusSize3};
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
  const [now, setNow] = React.useState(Date())
  useInterval(() => setNow(Date()), 500, true)

  const runTime =
    startedAt != null ? formatInterval(startedAt, now) : EMPTY_TIMESTAMP

  return (
    <Flex css={PAUSE_HEADER_STYLE}>
      <StyledText css={PAUSE_TEXT_STYLE}>
        {i18n.format(t('paused_for'), 'capitalize')}
      </StyledText>
      <StyledText css={PAUSE_TIME_STYLE}>{runTime}</StyledText>
    </Flex>
  )
}
