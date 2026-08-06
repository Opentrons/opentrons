import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  CURSOR_POINTER,
  DIRECTION_COLUMN,
  Divider,
  Flex,
  Icon,
  LiquidIcon,
  MenuItem,
  OVERFLOW_AUTO,
  POSITION_ABSOLUTE,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { NAV_BAR_HEIGHT_REM } from '/protocol-designer/components/atoms'
import { OVERFLOW_MENU_POSITION_ADJUSTMENT } from '/protocol-designer/constants'
import * as labwareIngredActions from '/protocol-designer/labware-ingred/actions'
import { getLiquidEntities } from '/protocol-designer/step-forms/selectors'
import lineClampStyles from '/protocol-designer/styles/lineclamp.module.css'

import type { MouseEvent, RefObject } from 'react'
import type { ThunkDispatch } from '/protocol-designer/types'

const TOP_POSITION = '14.2rem'
const RIGHT_POSITION_FOR_LIQUIDS_PAGE = '25.675rem'
interface LiquidsOverflowMenuProps {
  onClose: () => void
  showLiquidsModal: () => void
  overflowWrapperRef: RefObject<HTMLDivElement>
  targetWidth?: number
}

export function LiquidsOverflowMenu({
  onClose,
  showLiquidsModal,
  overflowWrapperRef,
  targetWidth,
}: LiquidsOverflowMenuProps): JSX.Element {
  const location = useLocation()
  const { t } = useTranslation(['starting_deck_state'])
  const liquids = useSelector(getLiquidEntities)
  const dispatch: ThunkDispatch<any> = useDispatch()

  let right: string | undefined
  let top: string = TOP_POSITION
  let left: string | undefined
  if (location.pathname === '/liquids') {
    right = RIGHT_POSITION_FOR_LIQUIDS_PAGE
    top = `${NAV_BAR_HEIGHT_REM + 3.1}rem`
    left = undefined
  } else {
    right = undefined
    left =
      targetWidth !== undefined
        ? `${targetWidth + OVERFLOW_MENU_POSITION_ADJUSTMENT}px`
        : undefined
  }

  return (
    <Flex
      position={POSITION_ABSOLUTE}
      zIndex={12}
      right={right}
      top={top}
      left={left}
      ref={overflowWrapperRef}
      borderRadius={BORDERS.borderRadius8}
      boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
      backgroundColor={COLORS.white}
      flexDirection={DIRECTION_COLUMN}
      onClick={(e: MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      width="9.375rem"
      maxHeight="18.75rem"
      overflowY={OVERFLOW_AUTO}
    >
      {Object.values(liquids).map(
        ({ displayName, displayColor, liquidGroupId }) => {
          return (
            <MenuItem
              onClick={() => {
                onClose()
                showLiquidsModal()
                dispatch(labwareIngredActions.selectLiquidGroup(liquidGroupId))
              }}
              key={liquidGroupId}
              css={css`
                cursor: ${CURSOR_POINTER};
              `}
            >
              <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing8}>
                <LiquidIcon color={displayColor ?? ''} />
                <StyledText
                  desktopStyle="bodyDefaultRegular"
                  className={clsx(
                    lineClampStyles.line_clamp,
                    lineClampStyles.word_break_all
                  )}
                  style={{
                    WebkitLineClamp: 3,
                    textAlign: TYPOGRAPHY.textAlignLeft,
                  }}
                >
                  {displayName}
                </StyledText>
              </Flex>
            </MenuItem>
          )
        }
      )}
      {Object.values(liquids).length > 0 ? (
        <Divider color={COLORS.grey20} marginY="0" />
      ) : null}
      <MenuItem
        onClick={() => {
          onClose()
          showLiquidsModal()
          dispatch(labwareIngredActions.createNewLiquidGroup())
        }}
        key="defineLiquid"
        css={css`
          cursor: ${CURSOR_POINTER};
        `}
      >
        <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing8}>
          <Icon name="plus" size="1rem" />
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('define_liquid')}
          </StyledText>
        </Flex>
      </MenuItem>
    </Flex>
  )
}
