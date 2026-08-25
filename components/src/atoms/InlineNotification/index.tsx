import { css } from 'styled-components'

import { BORDERS, COLORS } from '../../helix-design-system'
import { Icon } from '../../icons'
import { Box, Btn, Flex, Link } from '../../primitives'
import {
  ALIGN_CENTER,
  DIRECTION_ROW,
  JUSTIFY_FLEX_END,
  JUSTIFY_FLEX_START,
  JUSTIFY_SPACE_BETWEEN,
} from '../../styles'
import { RESPONSIVENESS, SPACING, TYPOGRAPHY } from '../../ui-style-constants'
import { StyledText } from '../StyledText'

import type { FlattenSimpleInterpolation } from 'styled-components'
import type { MouseEventHandler, ReactNode } from 'react'
import type { IconProps } from '../../icons'
import type { StyleProps } from '../../primitives'

type InlineNotificationType = 'alert' | 'error' | 'neutral' | 'success'

export interface InlineNotificationProps extends StyleProps {
  /** name constant of the icon to display */
  type: InlineNotificationType
  /** InlineNotification contents */
  heading?: string
  message?: string
  /** Optional dynamic width based on contents */
  hug?: boolean
  /** optional handler to show close button/clear alert  */
  onCloseClick?: (() => void) | MouseEventHandler<HTMLButtonElement>
  linkText?: string
  onLinkClick?: (() => void) | MouseEventHandler<HTMLAnchorElement>

  className?: string
}

const INLINE_NOTIFICATION_PROPS_BY_TYPE: Record<
  InlineNotificationType,
  { icon: IconProps; backgroundColor: string; color: string }
> = {
  alert: {
    icon: { name: 'ot-alert' },
    backgroundColor: COLORS.yellow30,
    color: COLORS.yellow60,
  },
  error: {
    icon: { name: 'ot-alert' },
    backgroundColor: COLORS.red30,
    color: COLORS.red60,
  },
  neutral: {
    icon: { name: 'information' },
    backgroundColor: COLORS.blue30,
    color: COLORS.blue60,
  },
  success: {
    icon: { name: 'ot-check' },
    backgroundColor: COLORS.green30,
    color: COLORS.green60,
  },
}

export function InlineNotification(props: InlineNotificationProps): ReactNode {
  const {
    heading,
    hug = false,
    onCloseClick,
    message,
    type,
    linkText,
    onLinkClick,
    className,
  } = props
  // TODO (sb: 8/20/25) RSQ-189 Remove punctuation from this component and add to translation strings
  // Temp fix (nd: 2/25/26): Avoid double-period for translations that already end in a period.
  const doesMessageEndInPeriod = message?.trim().match(/\.$/) ?? false
  const fullHeading = `${heading}${message && !doesMessageEndInPeriod ? '. ' : ''}`
  const fullMessage = `${message}${doesMessageEndInPeriod ? '' : '.'}`
  const inlineNotificationProps = INLINE_NOTIFICATION_PROPS_BY_TYPE[type]
  const iconProps = {
    ...inlineNotificationProps.icon,
    color: INLINE_NOTIFICATION_PROPS_BY_TYPE[type].color,
    size: '100%',
  }
  const backgroundColor =
    INLINE_NOTIFICATION_PROPS_BY_TYPE[type].backgroundColor

  return (
    <Flex
      data-testid={`InlineNotification_${type}`}
      css={INLINE_NOTIFICATION_WRAPPER_STYLES(backgroundColor, hug)}
      className={className}
    >
      <Flex css={INLINE_NOTIFICATION_FLEX_STYLE}>
        <Box css={INLINE_NOTIFICATION_BOX_STYLE}>
          <Icon {...iconProps} aria-label={`icon_${type}`} />
        </Box>
        <Flex flex="1" alignItems={ALIGN_CENTER}>
          <StyledText
            oddStyle="bodyTextRegular"
            desktopStyle="bodyDefaultRegular"
          >
            {heading != null && (
              <>
                <span
                  css={`
                    font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
                  `}
                >
                  {fullHeading}
                </span>
                {/* this break is because the desktop wants this on two lines, but also wants/
                  inline text layout on ODD. Soooo here you go */}
                <br
                  css={`
                    @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
                      display: none;
                    }
                  `}
                />
              </>
            )}
            {message != null && fullMessage}
          </StyledText>
        </Flex>
      </Flex>
      <Flex
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_FLEX_END}
        gap={SPACING.spacing16}
      >
        {linkText && (
          <Link onClick={onLinkClick}>
            <StyledText
              oddStyle="bodyTextRegular"
              desktopStyle="bodyDefaultRegular"
              textDecoration="underline"
              css={css`
                white-space: nowrap;
              `}
            >
              {linkText}
            </StyledText>
          </Link>
        )}
        {onCloseClick && (
          <Btn
            data-testid="InlineNotification_close-button"
            onClick={onCloseClick}
            css={INLINE_NOTIFICATION_CLOSE_BUTTON_STYLE}
            height="fit-content"
          >
            <Icon
              aria-label="close_icon"
              name="close"
              css={INLINE_NOTIFICATION_ICON_STYLE}
            />
          </Btn>
        )}
      </Flex>
    </Flex>
  )
}

const INLINE_NOTIFICATION_WRAPPER_STYLES = (
  backgroundColor: string,
  hug: boolean
): FlattenSimpleInterpolation => css`
  background-color: ${backgroundColor};
  align-items: ${ALIGN_CENTER};
  flex-direction: ${DIRECTION_ROW};
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  width: ${hug ? 'max-content' : '100%'};
  gap: ${SPACING.spacing8};
  border-radius: ${BORDERS.borderRadius4};
  padding: ${SPACING.spacing8} ${SPACING.spacing12};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    gap: ${SPACING.spacing12};
    border-radius: ${BORDERS.borderRadius8};
    padding: ${SPACING.spacing12} ${SPACING.spacing16};
  }
`

const INLINE_NOTIFICATION_FLEX_STYLE = css`
  justify-content: ${JUSTIFY_FLEX_START};
  align-items: ${ALIGN_CENTER};
  flex-direction: ${DIRECTION_ROW};
  gap: ${SPACING.spacing8};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    gap: ${SPACING.spacing12};
  }
`

const INLINE_NOTIFICATION_BOX_STYLE = css`
  width: 1rem;
  height: 1rem;
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    width: 1.75rem;
    height: 1.75rem;
  }
`

const INLINE_NOTIFICATION_CLOSE_BUTTON_STYLE = css`
  width: 1.75rem;
  height: 1.75rem;
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    width: 3rem;
    height: 3rem;
  }
`

const INLINE_NOTIFICATION_ICON_STYLE = css`
  width: 1.75rem;
  height: 1.75rem;
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    width: 3rem;
    height: 3rem;
  }
`
