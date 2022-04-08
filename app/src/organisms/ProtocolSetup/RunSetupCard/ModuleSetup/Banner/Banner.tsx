import * as React from 'react'
import {
  COLORS,
  Flex,
  Text,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_ROW,
  ALIGN_CENTER,
  TYPOGRAPHY,
  SPACING,
  Icon,
  PrimaryBtn,
  TEXT_TRANSFORM_NONE,
} from '@opentrons/components'

interface BannerProps {
  title: string
  children?: React.ReactNode
}

export function Banner(props: BannerProps): JSX.Element | null {
  const { title, children } = props

  return (
    <React.Fragment>
      <Flex
        marginTop={TYPOGRAPHY.lineHeight16}
        flexDirection={DIRECTION_ROW}
        backgroundColor={COLORS.background}
        padding={SPACING.spacing5}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <Flex flexDirection={DIRECTION_COLUMN}>
          <Flex flexDirection={DIRECTION_ROW}>
            <Icon
              size={SPACING.spacing6}
              color={COLORS.darkGreyEnabled}
              name="information"
              paddingRight={SPACING.spacing3}
              paddingBottom={TYPOGRAPHY.fontSizeCaption}
              aria-label="information_icon"
            />
            <Text
              fontSize={TYPOGRAPHY.fontSizeH3}
              data-testid={`banner_title_${title}`}
              color={COLORS.darkBlack}
            >
              {title}
            </Text>
          </Flex>
          {children}
        </Flex>
      </Flex>
    </React.Fragment>
  )
}
