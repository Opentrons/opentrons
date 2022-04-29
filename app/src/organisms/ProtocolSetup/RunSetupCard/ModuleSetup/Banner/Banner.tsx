import * as React from 'react'
import {
  COLORS,
  Flex,
  Text,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_ROW,
  TYPOGRAPHY,
  SPACING,
  Icon,
  NewPrimaryBtn,
  TEXT_TRANSFORM_NONE,
  SIZE_6,
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
        flexDirection={DIRECTION_COLUMN}
        backgroundColor={COLORS.background}
        padding={SPACING.spacing5}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <Flex
          flexDirection={DIRECTION_COLUMN}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
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
        </Flex>
        {children}
      </Flex>
    </React.Fragment>
  )
}

interface BannerItemProps {
  title: string
  body: string
  btnText: string
  onClick: () => void
}

export const BannerItem = (props: BannerItemProps): JSX.Element => {
  return (
    <>
      <Text
        fontSize={TYPOGRAPHY.fontSizeP}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        color={COLORS.darkBlack}
        paddingTop={SPACING.spacing4}
      >
        {props.title}
      </Text>
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <Text
          marginTop={SPACING.spacing3}
          color={COLORS.darkGrey}
          fontSize={TYPOGRAPHY.fontSizeP}
          maxWidth={SIZE_6}
          data-testid={`banner_subtitle_${props.title}`}
        >
          {props.body}
        </Text>
        <NewPrimaryBtn
          backgroundColor={COLORS.blue}
          borderRadius={SPACING.spacingM}
          textTransform={TEXT_TRANSFORM_NONE}
          css={TYPOGRAPHY.labelRegular}
          marginBottom={SPACING.spacingXL}
          data-testid={`banner_open_wizard_btn`}
          onClick={() => props.onClick()}
        >
          {props.btnText}
        </NewPrimaryBtn>
      </Flex>
    </>
  )
}
