import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import type { IconName, ODDStyles, StyleProps } from '@opentrons/components'

export type OddInfoScreenType =
  'error' | 'alt' | 'neutral' | 'success' | 'warning'

interface OddInfoScreenProps extends StyleProps {
  type: OddInfoScreenType
  header: string
  hasIcon?: boolean
  subText?: string
  textSize?: 'small' | 'large'
  iconName?: IconName
}

const INFO_SCREEN_PROPS_BY_TYPE: Record<
  OddInfoScreenType,
  {
    backgroundColor: string
    iconColor?: string
  }
> = {
  neutral: { backgroundColor: COLORS.grey35, iconColor: COLORS.grey60 },
  error: { backgroundColor: COLORS.red35, iconColor: COLORS.red60 },
  success: { backgroundColor: COLORS.green35, iconColor: COLORS.green60 },
  warning: { backgroundColor: COLORS.yellow35, iconColor: COLORS.yellow60 },
  alt: { backgroundColor: COLORS.blue35, iconColor: COLORS.blue60 },
}

const INFO_SCREEN_PROPS_BY_SIZE: Record<
  'small' | 'large',
  {
    iconSize: string
    headerStyle: ODDStyles
    subTextStyle: ODDStyles
  }
> = {
  small: {
    iconSize: '2.5rem',
    headerStyle: 'level4HeaderBold',
    subTextStyle: 'bodyTextRegular',
  },
  large: {
    iconSize: '3.75rem',
    headerStyle: 'level3HeaderBold',
    subTextStyle: 'level4HeaderRegular',
  },
}

export function OddInfoScreen(props: OddInfoScreenProps): JSX.Element {
  const {
    type,
    header,
    hasIcon = true,
    subText,
    textSize = 'small',
    iconName,
    ...styleProps
  } = props

  const iconType = iconName ?? (type === 'success' ? 'ot-check' : 'ot-alert')
  const backgroundColor = INFO_SCREEN_PROPS_BY_TYPE[type].backgroundColor
  const iconColor = INFO_SCREEN_PROPS_BY_TYPE[type].iconColor
  const iconSize = INFO_SCREEN_PROPS_BY_SIZE[textSize].iconSize
  const headerStyle = INFO_SCREEN_PROPS_BY_SIZE[textSize].headerStyle
  const subTextStyle = INFO_SCREEN_PROPS_BY_SIZE[textSize].subTextStyle

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
      width="100%"
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing24}
      backgroundColor={backgroundColor}
      borderRadius={BORDERS.borderRadius12}
      padding={`${SPACING.spacing40} ${SPACING.spacing80} `}
      data-testid="InfoScreen"
      {...styleProps}
    >
      {hasIcon ? (
        <Icon
          name={iconType}
          size={iconSize}
          color={iconColor}
          aria-label={`icon-${iconType}`}
        />
      ) : null}
      <Flex
        flexDirection={DIRECTION_COLUMN}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
        gridGap={SPACING.spacing4}
        width="100%"
      >
        <StyledText oddStyle={headerStyle}>{header}</StyledText>
        {subText != null ? (
          <StyledText
            textAlign={TYPOGRAPHY.textAlignCenter}
            oddStyle={subTextStyle}
            color={COLORS.grey60}
          >
            {subText}
          </StyledText>
        ) : null}
      </Flex>
    </Flex>
  )
}
