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
  subtitle?: string
  body: string
  btnText: string
  onClick: () => void
}

export function Banner(props: BannerProps): JSX.Element | null {
  const { title, subtitle, body, btnText, onClick } = props

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
          {subtitle !== null && (
            <Text
              fontSize={TYPOGRAPHY.fontSizeP}
              color={COLORS.darkBlack}
              paddingTop={SPACING.spacing4}
            >
              {subtitle}
            </Text>
          )}
          <Text
            paddingTop={subtitle === null ? SPACING.spacingM : SPACING.spacing2}
            color={COLORS.darkGrey}
            fontSize={TYPOGRAPHY.fontSizeP}
            data-testid={`banner_body_${title}`}
          >
            {body}
          </Text>
        </Flex>

        {/* TODO immediately: use NewPrimaryBtn when sarah's pr is merged */}
        <PrimaryBtn
          marginTop={TYPOGRAPHY.bannerButtonTopMargin}
          backgroundColor={COLORS.blue}
          borderRadius={SPACING.spacingM}
          textTransform={TEXT_TRANSFORM_NONE}
          css={TYPOGRAPHY.labelRegular}
          alignItems={ALIGN_CENTER}
          marginRight={SPACING.spacing3}
          data-testid={`banner_open_wizard_btn`}
          onClick={onClick}
        >
          {btnText}
        </PrimaryBtn>
      </Flex>
    </React.Fragment>
  )
}
