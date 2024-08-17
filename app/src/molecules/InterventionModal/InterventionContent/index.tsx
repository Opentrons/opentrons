import * as React from 'react'
import {
  Flex,
  StyledText,
  DIRECTION_COLUMN,
  SPACING,
  RESPONSIVENESS,
} from '@opentrons/components'
import { InlineNotification } from '../../../atoms/InlineNotification'

import { InterventionInfo } from './InterventionInfo'
export type { InterventionInfoProps } from './InterventionInfo'
export { InterventionInfo }

export interface InterventionContentProps {
  headline: string
  infoProps: React.ComponentProps<typeof InterventionInfo>
  notificationProps?: React.ComponentProps<typeof InlineNotification>
}

export function InterventionContent({
  headline,
  infoProps,
  notificationProps,
}: InterventionContentProps): JSX.Element {
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      css={`
        gap: ${SPACING.spacing16};
        width: 100%;
        .${RESPONSIVENESS.TOUCH_ODD_CLASS} {
          gap: ${SPACING.spacing8};
          width: 27rem;
        }
      `}
    >
      <StyledText
        oddStyle="level4HeaderSemiBold"
        desktopStyle="headingSmallBold"
      >
        {headline}
      </StyledText>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        css={`
          gap: ${SPACING.spacing16};
          width: 100%;
          .${RESPONSIVENESS.TOUCH_ODD_CLASS} {
            gap: ${SPACING.spacing24};
          }
        `}
      >
        <InterventionInfo {...infoProps} />
        {notificationProps ? (
          <InlineNotification {...notificationProps} />
        ) : null}
      </Flex>
    </Flex>
  )
}
