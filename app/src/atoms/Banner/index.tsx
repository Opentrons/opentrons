import * as React from 'react'
import {
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  IconProps,
  Flex,
  DIRECTION_ROW,
  ALIGN_CENTER,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDERS,
  Btn,
} from '@opentrons/components'
import { css } from 'styled-components'

export type BannerType = 'success' | 'warning' | 'error' | 'updating'

export interface BannerProps {
  /** name constant of the icon to display */
  type: BannerType
  /** title/main message of colored alert bar */
  title: React.ReactNode
  /** Alert message body contents */
  children?: React.ReactNode
  /** optional handler to show close button/clear alert  */
  onCloseClick?: () => unknown
  /** Override the default Alert Icon */
  icon?: IconProps
}

const BANNER_PROPS_BY_TYPE: Record<
  BannerType,
  { icon: IconProps; backgroundColor: string; color: string }
> = {
  success: {
    icon: { name: 'check-circle' },
    backgroundColor: COLORS.successBg,
    color: COLORS.success,
  },
  error: {
    icon: { name: 'information' },
    backgroundColor: COLORS.errorBg,
    color: COLORS.error,
  },
  warning: {
    icon: { name: 'information' },
    backgroundColor: COLORS.warningBg,
    color: COLORS.warning,
  },
  updating: {
    icon: { name: 'ot-spinner' },
    backgroundColor: COLORS.greyDisabled,
    color: COLORS.darkGreyEnabled,
  },
}

const MESSAGE_STYLING = css`
  padding: ${SPACING.spacing4} 3rem;
  background-color: ${COLORS.white};

  & a {
    text-decoration: underline;
    color: inherit;
  }

  &:empty {
    padding: 0;
  }
`
export function Banner(props: BannerProps): JSX.Element {
  const bannerProps = BANNER_PROPS_BY_TYPE[props.type]
  const icon = props.icon ? props.icon : bannerProps.icon

  const iconProps = {
    ...icon,
    size: SPACING.spacing4,
    marginRight: SPACING.spacing3,
    color: BANNER_PROPS_BY_TYPE[props.type].color,
  }

  return (
    <Flex
      fontSize={TYPOGRAPHY.fontSizeP}
      fontWeight={TYPOGRAPHY.fontWeightRegular}
      borderRadius={SPACING.spacing2}
      backgroundColor={BANNER_PROPS_BY_TYPE[props.type].backgroundColor}
      border={`${SPACING.spacingXXS} ${BORDERS.styleSolid} ${
        BANNER_PROPS_BY_TYPE[props.type].color
      }`}
    >
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        flex="auto"
        alignItems={ALIGN_CENTER}
        padding={`${SPACING.spacing2} ${SPACING.spacing2} ${SPACING.spacing2} ${SPACING.spacing3}`}
        fontWeight={TYPOGRAPHY.fontWeightRegular}
        data-testid={`Banner_${props.title}_${props.type}`}
      >
        <Icon
          {...iconProps}
          aria-label={`icon_${props.type}`}
          spin={BANNER_PROPS_BY_TYPE[props.type].icon.name === 'ot-spinner'}
        />
        <Flex width="100%">{props.title}</Flex>
        {props.onCloseClick && (
          <Btn
            onClick={props.onCloseClick}
            width={SPACING.spacing5}
            height={SPACING.spacing5}
          >
            <Icon name="close" aria-label="close_icon" />
          </Btn>
        )}
      </Flex>
      {props.children && <Flex css={MESSAGE_STYLING}>{props.children}</Flex>}
    </Flex>
  )
}
