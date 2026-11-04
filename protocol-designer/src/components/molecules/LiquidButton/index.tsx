import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  Btn,
  COLORS,
  CURSOR_POINTER,
  DISPLAY_FLEX,
  Icon,
  SPACING,
  StyledText,
} from '@opentrons/components'

import type { Dispatch, ReactNode, SetStateAction } from 'react'

const BUTTON_HEIGHT_IN_TOOLBOX = '2.4375rem'
interface LiquidButtonProps {
  showLiquidOverflowMenu: Dispatch<SetStateAction<boolean>>
  isInToolbox?: boolean
}

export function LiquidButton({
  showLiquidOverflowMenu,
  isInToolbox = false,
}: LiquidButtonProps): ReactNode {
  const { t } = useTranslation('starting_deck_state')
  return (
    <Btn
      css={isInToolbox ? LIQUID_BUTTON_STYLE_IN_TOOLBOX : LIQUID_BUTTON_STYLE}
      onClick={() => {
        showLiquidOverflowMenu(true)
      }}
    >
      <Icon size={isInToolbox ? '1.25rem' : '1rem'} name="water-drop" />
      <StyledText
        desktopStyle={
          isInToolbox ? 'bodyDefaultRegular' : 'bodyDefaultSemiBold'
        }
      >
        {t('liquids')}
      </StyledText>
    </Btn>
  )
}

const LIQUID_BUTTON_STYLE = css`
  display: ${DISPLAY_FLEX};
  padding: ${SPACING.spacing8} ${SPACING.spacing16};
  grid-gap: ${SPACING.spacing8};
  align-items: ${ALIGN_CENTER};
  border-radius: ${BORDERS.borderRadius8};
  background-color: ${COLORS.grey30};

  &:focus-visible {
    outline-offset: 3px;
    outline: 2px ${BORDERS.styleSolid} ${COLORS.blue50};
  }

  &:active {
    background-color: ${COLORS.grey40};
  }

  &:hover {
    box-shadow: 0 0 0;
    background-color: ${COLORS.grey35};
  }

  &:disabled {
    background-color: ${COLORS.grey30};
    color: ${COLORS.grey40};
  }
`
const LIQUID_BUTTON_STYLE_IN_TOOLBOX = css`
  ${LIQUID_BUTTON_STYLE}
  height: ${BUTTON_HEIGHT_IN_TOOLBOX}
 padding: ${SPACING.spacing4} ${SPACING.spacing12};
  background-color: ${COLORS.blue20};
  color: ${COLORS.black90};
  cursor: ${CURSOR_POINTER};

  &:hover {
    background-color: ${COLORS.blue30};
    color: ${COLORS.black90};
  }

  &:active {
    background-color: ${COLORS.blue50};
    color: ${COLORS.white};
  }
`
