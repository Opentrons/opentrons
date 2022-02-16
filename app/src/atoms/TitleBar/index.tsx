import * as React from 'react'
import { css } from 'styled-components'
import {
  Btn,
  ButtonProps,
  Icon,
  POSITION_ABSOLUTE,
  SPACING,
  Text,
  TEXT_TRANSFORM_CAPITALIZE,
  TYPOGRAPHY,
  Flex,
  COLORS,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'

export interface TitleBarProps {
  title: React.ReactNode
  exit?: ButtonProps
}

const TITLE_BAR = css`
  position: ${POSITION_ABSOLUTE};
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 3;
`

export function TitleBar(props: TitleBarProps): JSX.Element {
  const { title, exit } = props

  return (
    <Flex
      width="100%"
      height={SPACING.spacingXL}
      backgroundColor={COLORS.darkBlack}
      color={COLORS.white}
      flexDirection={DIRECTION_ROW}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      css={TITLE_BAR}
      data-testid={`titlebar`}
    >
      <Flex padding={SPACING.spacingXS} data-testid={`titlebar_${title}`}>
        <Icon
          name="ot-logo"
          width={TYPOGRAPHY.lineHeight18}
          height={TYPOGRAPHY.lineHeight18}
          paddingTop={SPACING.spacing1}
          aria-label="ot-logo"
        />
        <Flex
          paddingLeft={SPACING.spacingXS}
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          fontSize={TYPOGRAPHY.fontSizeH3}
        >
          {title}
        </Flex>
      </Flex>
      {exit && (
        <Flex
          paddingRight={TYPOGRAPHY.fontSizeH6}
          data-testid={`titlebar_${exit.title}`}
        >
          <Text
            paddingRight={SPACING.spacingSS}
            paddingTop={SPACING.spacingXS}
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            fontSize={TYPOGRAPHY.fontSizeH3}
            textTransform={TEXT_TRANSFORM_CAPITALIZE}
          >
            {exit.title}
          </Text>
          <Btn
            size={'1.5rem'}
            onClick={exit.onClick}
            paddingTop={SPACING.spacingS}
            aria-label="close_btn"
          >
            <Icon name="close" aria-label="close" color={COLORS.white} />
          </Btn>
        </Flex>
      )}
    </Flex>
  )
}
