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
  SIZE_6,
  SIZE_1,
  JUSTIFY_CENTER,
  ALIGN_FLEX_START,
} from '@opentrons/components'

import { StyledText } from '../../../../../atoms/text'
import { TertiaryButton } from '../../../../../atoms/buttons'

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
          <Flex
            flexDirection={DIRECTION_ROW}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
          >
            <Flex alignItems={JUSTIFY_CENTER}>
              <Icon
                size={SIZE_1}
                color={COLORS.darkGreyEnabled}
                name="information"
                marginRight={SPACING.spacing3}
                aria-label="information_icon"
              />
              <StyledText
                css={TYPOGRAPHY.h3SemiBold}
                data-testid={`banner_title_${title}`}
              >
                {title}
              </StyledText>
            </Flex>
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
        <TertiaryButton
          alignSelf={ALIGN_FLEX_START}
          data-testid={`banner_open_wizard_btn`}
          onClick={() => props.onClick()}
        >
          {props.btnText}
        </TertiaryButton>
      </Flex>
    </>
  )
}
