import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  COLORS,
  CURSOR_POINTER,
  DIRECTION_COLUMN,
  Divider,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  JUSTIFY_START,
  LINE_CLAMP_TEXT_STYLE,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'
import {
  getHoveredTerminalItemId,
  getSelectedTerminalItemId,
} from '../../../../ui/steps'
import { HARDWARE_ID } from '../../../../steplist'
import {
  hoverOnTerminalItem,
  selectTerminalItem,
} from '../../../../ui/steps/actions/actions'
import { getRobotType } from '../../../../file-data/selectors'
import { PX_SIDEBAR_MIN_WIDTH_FOR_ICON } from './StepContainer'

import type { ThunkDispatch } from '../../../../types'

interface HardwareStepProps {
  sidebarWidth: number
}

export function HardwareStep(props: HardwareStepProps): JSX.Element {
  const { t } = useTranslation('protocol_steps')
  const { sidebarWidth } = props
  const robotType = useSelector(getRobotType)
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const title: string =
    robotType === FLEX_ROBOT_TYPE ? t('deck_hardware') : t('modules')
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
    <>
      <Flex
        gridGap={SPACING.spacing8}
        padding={SPACING.spacing12}
        flexDirection={DIRECTION_COLUMN}
      >
        <StyledText
          desktopStyle="bodyDefaultSemiBold"
          css={LINE_CLAMP_TEXT_STYLE(1)}
        >
          {title}
        </StyledText>
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
            <Icon
              size="1.25rem"
              name="deck-map"
              color={color}
              minWidth="1.25rem"
            />
            {hasText ? (
              <StyledText
                desktopStyle="bodyDefaultRegular"
                css={LINE_CLAMP_TEXT_STYLE(1)}
              >
                {robotType === FLEX_ROBOT_TYPE
                  ? t('modules_and_fixtures')
                  : t('modules')}
              </StyledText>
            ) : null}
          </Flex>
        </Box>
      </Flex>
      <Divider />
    </>
  )
}
