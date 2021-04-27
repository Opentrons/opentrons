import * as React from 'react'
import { NavLink } from 'react-router-dom'
import { css } from 'styled-components'

import {
  Box,
  Text,
  Tooltip,
  NotificationIcon,
  useHoverTooltip,
  TOOLTIP_RIGHT,
  SPACING_2,
  BORDER_WIDTH_DEFAULT,
  TEXT_ALIGN_CENTER,
  FONT_SIZE_CAPTION,
  FONT_WEIGHT_SEMIBOLD,
  TEXT_TRANSFORM_UPPERCASE,
  LINE_HEIGHT_COPY,
  C_NEAR_WHITE,
  C_LIGHT_GRAY,
  C_MED_GRAY,
  C_DARK_GRAY,
} from '@opentrons/components'

import type { StyleProps } from '@opentrons/components'
import type { NavLocation } from '../../redux/nav/types'

export type NavbarLinkProps = NavLocation & StyleProps

const ACTIVE_STYLE = css`
  &.active {
    color: ${C_DARK_GRAY};
    background-color: ${C_NEAR_WHITE};
    position: relative;

    /* cover the navbar's right border when active to flow into the side panel */
    &::after {
      position: absolute;
      content: '';
      top: 0;
      bottom: 0;
      left: 100%;
      width: ${BORDER_WIDTH_DEFAULT};
      background-color: ${C_NEAR_WHITE};
    }
  }
`

export function NavbarLink(props: NavbarLinkProps): JSX.Element {
  const {
    id,
    path,
    title,
    iconName,
    disabledReason,
    notificationReason,
    warningReason,
    ...styleProps
  } = props

  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_RIGHT,
  })
  const tooltipContents =
    disabledReason ?? notificationReason ?? warningReason ?? null
  const hasNotification = Boolean(notificationReason)
  const isDisabled = Boolean(disabledReason)
  const hasWarning = Boolean(warningReason)

  const LinkComponent = isDisabled ? 'div' : NavLink
  const linkProps = isDisabled ? styleProps : { to: path, ...styleProps }

  return (
    <>
      <Box
        as={LinkComponent}
        textAlign={TEXT_ALIGN_CENTER}
        paddingY={SPACING_2}
        color={isDisabled ? C_LIGHT_GRAY : C_MED_GRAY}
        css={ACTIVE_STYLE}
        {...linkProps}
        {...targetProps}
      >
        <NotificationIcon
          name={iconName}
          childName={
            hasWarning ? 'alert-circle' : hasNotification ? 'circle' : null
          }
          width="100%"
          paddingX={SPACING_2}
        />
        <Text
          fontSize={FONT_SIZE_CAPTION}
          fontWeight={FONT_WEIGHT_SEMIBOLD}
          textTransform={TEXT_TRANSFORM_UPPERCASE}
          lineHeight={LINE_HEIGHT_COPY}
        >
          {title}
        </Text>
      </Box>
      {tooltipContents !== null && (
        <Tooltip {...tooltipProps}>{tooltipContents}</Tooltip>
      )}
    </>
  )
}
