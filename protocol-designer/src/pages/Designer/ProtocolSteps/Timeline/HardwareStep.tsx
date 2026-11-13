import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  COLORS,
  CURSOR_POINTER,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  JUSTIFY_START,
  LINE_CLAMP_TEXT_STYLE,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { HARDWARE_ID } from '/protocol-designer/steplist'
import {
  getHoveredTerminalItemId,
  getSelectedTerminalItemId,
} from '/protocol-designer/ui/steps'
import {
  hoverOnTerminalItem,
  selectTerminalItem,
} from '/protocol-designer/ui/steps/actions/actions'

import { PX_SIDEBAR_MIN_WIDTH_FOR_ICON } from './ConnectedStepContainer'

import type { ReactNode } from 'react'
import type { ThunkDispatch } from '/protocol-designer/types'

interface HardwareStepProps {
  sidebarWidth: number
}

export function HardwareStep(props: HardwareStepProps): ReactNode {
  const { t } = useTranslation('protocol_steps')
  const { sidebarWidth } = props
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const hovered = useSelector(getHoveredTerminalItemId) === HARDWARE_ID
  const selected = useSelector(getSelectedTerminalItemId) === HARDWARE_ID

  let backgroundColor = COLORS.blue20
  let color = COLORS.black90
  if (selected) {
    backgroundColor = COLORS.blue50
    color = COLORS.white
  }
  if (hovered && !selected) {
    backgroundColor = COLORS.blue30
  }
  const hasText = sidebarWidth > PX_SIDEBAR_MIN_WIDTH_FOR_ICON

  return (
    <Box
      role="button"
      onClick={() => {
        dispatch(selectTerminalItem(HARDWARE_ID))
      }}
      onMouseEnter={() => {
        dispatch(hoverOnTerminalItem(HARDWARE_ID))
      }}
      onMouseLeave={() => {
        dispatch(hoverOnTerminalItem(null))
      }}
      padding={`${SPACING.spacing4} ${SPACING.spacing12}`}
      borderRadius={BORDERS.borderRadius8}
      width="100%"
      backgroundColor={backgroundColor}
      cursor={CURSOR_POINTER}
      color={color}
    >
      <Flex
        height="1.9375rem"
        alignItems={ALIGN_CENTER}
        gridGap={SPACING.spacing8}
        justifyContent={hasText ? JUSTIFY_START : JUSTIFY_CENTER}
        width="100%"
      >
        <Icon size="1.25rem" name="deck-map" color={color} minWidth="1.25rem" />
        {hasText ? (
          <StyledText
            desktopStyle="bodyDefaultRegular"
            css={LINE_CLAMP_TEXT_STYLE(1)}
          >
            {t('deck_hardware')}
          </StyledText>
        ) : null}
      </Flex>
    </Box>
  )
}
