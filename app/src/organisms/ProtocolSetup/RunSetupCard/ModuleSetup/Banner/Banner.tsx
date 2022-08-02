import * as React from 'react'
import {
  COLORS,
  Flex,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_ROW,
  TYPOGRAPHY,
  SPACING,
  Icon,
  SIZE_6,
  SIZE_1,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
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
    <Flex
      marginTop={SPACING.spacing4}
      flexDirection={DIRECTION_COLUMN}
      backgroundColor={COLORS.fundamentalsBackground}
      padding={SPACING.spacing5}
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

      {children}
    </Flex>
  )
}

interface BannerItemProps {
  title: string
  body: string
  btnText: string
  onClick: () => void
}

export const BannerItem = (props: BannerItemProps): JSX.Element => {
  const { title, body, btnText, onClick } = props
  return (
    <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} alignItems={ALIGN_CENTER}>
      <Flex flexDirection={DIRECTION_COLUMN}>
        <StyledText css={TYPOGRAPHY.pSemiBold} paddingTop={SPACING.spacing4}>
          {title}
        </StyledText>
        <StyledText
          as="p"
          marginTop={SPACING.spacing3}
          color={COLORS.darkGrey}
          maxWidth={SIZE_6}
          data-testid={`banner_subtitle_${title}`}
        >
          {body}
        </StyledText>
      </Flex>
      <TertiaryButton
        data-testid="banner_open_wizard_btn"
        onClick={() => onClick()}
      >
        {btnText}
      </TertiaryButton>
    </Flex>
  )
}
