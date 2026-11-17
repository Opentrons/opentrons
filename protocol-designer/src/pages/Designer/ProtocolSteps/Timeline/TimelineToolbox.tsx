import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import {
  ALIGN_CENTER,
  Btn,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  LINE_CLAMP_TEXT_STYLE,
  OVERFLOW_WRAP_ANYWHERE,
  POSITION_RELATIVE,
  SPACING,
  StyledText,
  Toolbox,
} from '@opentrons/components'

import {
  LINK_BUTTON_STYLE,
  NAV_BAR_HEIGHT_REM,
} from '/protocol-designer/components/atoms'
import { getFileMetadata } from '/protocol-designer/file-data/selectors'
import {
  END_TERMINAL_ITEM_ID,
  START_TERMINAL_ITEM_ID,
} from '/protocol-designer/steplist'
import { actions as stepsActions } from '/protocol-designer/ui/steps'
import {
  selectDropdownItem,
  selectTerminalItem,
} from '/protocol-designer/ui/steps/actions/actions'

import { AddStepButton } from './AddStepButton'
import { Configurations } from './Configurations'
import { DraggableSteps } from './DraggableSteps'
import { PresavedStep } from './PresavedStep'
import { TerminalItemStep } from './TerminalItemStep'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type { ThunkDispatch } from '/protocol-designer/types'

const SIDEBAR_MIN_WIDTH_FOR_ICON = 170
const SIDEBAR_MIN_WIDTH_FOR_BACK_TEXT = 100
interface TimelineToolboxProps {
  sidebarWidth: number
  showLiquidOverflowMenu: Dispatch<SetStateAction<boolean>>
}

export function TimelineToolbox({
  sidebarWidth,
  showLiquidOverflowMenu,
}: TimelineToolboxProps): ReactNode {
  const { t } = useTranslation([
    'protocol_steps',
    'protocol_overview',
    'starting_deck_state',
  ])
  const fileMetadata = useSelector(getFileMetadata)
  const navigate = useNavigate()
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const isWidthForBackText = sidebarWidth < SIDEBAR_MIN_WIDTH_FOR_BACK_TEXT
  const protocolName = fileMetadata.protocolName

  const handleKeyDown: (e: KeyboardEvent) => void = e => {
    const { key, altKey: altIsPressed } = e

    if (altIsPressed) {
      if (key === 'ArrowUp') {
        dispatch(stepsActions.reorderSelectedStep('up'))
      } else if (key === 'ArrowDown') {
        dispatch(stepsActions.reorderSelectedStep('down'))
      }
    }
  }

  useEffect(
    () => {
      const onKeyDown = (e: KeyboardEvent): void => {
        handleKeyDown(e)
      }

      global.addEventListener('keydown', onKeyDown, false)

      return () => {
        global.removeEventListener('keydown', onKeyDown, false)
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const handleGoBack = (): void => {
    navigate('/overview')
    dispatch(selectTerminalItem(START_TERMINAL_ITEM_ID))
    dispatch(
      selectDropdownItem({
        selection: null,
        mode: 'clear',
      })
    )
  }

  const name: string =
    protocolName != null && protocolName !== ''
      ? protocolName
      : t('protocol_overview:untitled_protocol')

  return (
    <Toolbox
      position={POSITION_RELATIVE}
      height="100%"
      maxHeight={`calc(100vh - ${NAV_BAR_HEIGHT_REM}rem - 2 * ${SPACING.spacing12})`}
      width={`${sidebarWidth / 16}rem`}
      childrenContainerTestId="TimelineToolbox_scrollContainer"
      title={
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
          <StyledText
            desktopStyle="bodyLargeSemiBold"
            overflowWrap={OVERFLOW_WRAP_ANYWHERE}
            css={LINE_CLAMP_TEXT_STYLE(1)}
          >
            {name}
          </StyledText>
          <Btn css={LINK_BUTTON_STYLE} onClick={handleGoBack}>
            <Flex gridGap={SPACING.spacing4} alignItems={ALIGN_CENTER}>
              <Icon name="chevron-left" size="0.75rem" minWidth="0.75rem" />
              <StyledText
                desktopStyle="bodyDefaultRegular"
                css={isWidthForBackText ? undefined : LINE_CLAMP_TEXT_STYLE(1)}
              >
                {isWidthForBackText ? t('back') : t('back_to_overview')}
              </StyledText>
            </Flex>
          </Btn>
        </Flex>
      }
      titlePadding={SPACING.spacing12}
      childrenPadding="0px"
      confirmButton={
        <AddStepButton
          hasText={sidebarWidth > SIDEBAR_MIN_WIDTH_FOR_ICON}
          sidebarWidth={sidebarWidth}
        />
      }
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing4}
        width="100%"
      >
        <Configurations
          sidebarWidth={sidebarWidth}
          showLiquidOverflowMenu={showLiquidOverflowMenu}
        />
        <Flex
          padding={SPACING.spacing12}
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing8}
        >
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {t('timeline')}
          </StyledText>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            // Negative margin to undo the first and last steps' built-in y-padding.
            // eslint-disable-next-line opentrons/no-margins-inline
            marginY={`-${SPACING.spacing2}`}
          >
            <TerminalItemStep
              id={START_TERMINAL_ITEM_ID}
              sidebarWidth={sidebarWidth}
            />
            <DraggableSteps sidebarWidth={sidebarWidth} />
            <PresavedStep sidebarWidth={sidebarWidth} />
            <TerminalItemStep
              id={END_TERMINAL_ITEM_ID}
              sidebarWidth={sidebarWidth}
            />
          </Flex>
        </Flex>
      </Flex>
    </Toolbox>
  )
}
