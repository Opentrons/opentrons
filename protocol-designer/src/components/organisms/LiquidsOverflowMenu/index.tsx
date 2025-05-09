import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
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

import * as labwareIngredActions from '../../../labware-ingred/actions'
import { selectors } from '../../../labware-ingred/selectors'
import {
  getLiquidEntities,
  getUnsavedForm,
} from '../../../step-forms/selectors'
import { LINE_CLAMP_TEXT_STYLE, NAV_BAR_HEIGHT_REM } from '../../atoms'

import type { MouseEvent, RefObject } from 'react'
import type { ThunkDispatch } from '../../../types'

const TOP_POSITION = '13.6875rem'
const LEFT_POSITION = '14.9375rem'

interface LiquidsOverflowMenuProps {
  onClose: () => void
  showLiquidsModal: () => void
  overflowWrapperRef: RefObject<HTMLDivElement>
}

export function LiquidsOverflowMenu(
  props: LiquidsOverflowMenuProps
): JSX.Element {
  const { onClose, showLiquidsModal, overflowWrapperRef } = props
  const formData = useSelector(getUnsavedForm)
  const location = useLocation()
  const { t } = useTranslation(['starting_deck_state'])
  const liquids = useSelector(getLiquidEntities)
  const dispatch: ThunkDispatch<any> = useDispatch()
  const zoomIn = useSelector(selectors.getZoomedInSlot)

  let right: string = SPACING.spacing12
  if (formData != null || location.pathname === '/liquids') {
    right = '23.4rem'
  } else if (zoomIn?.slot === 'offDeck') {
    right = '24.75rem'
  }
  return (
    <Flex
      position={POSITION_ABSOLUTE}
      zIndex={12}
      // right={right}
      // top={`calc(${NAV_BAR_HEIGHT_REM}rem + 3.1rem)`}
      top={TOP_POSITION}
      left={LEFT_POSITION}
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
              data-testid={`${displayName}_${liquidGroupId}`}
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
                  css={`
                    ${LINE_CLAMP_TEXT_STYLE(3)}
                    text-align: ${TYPOGRAPHY.textAlignLeft}
                  `}
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
        data-testid="defineLiquid"
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
