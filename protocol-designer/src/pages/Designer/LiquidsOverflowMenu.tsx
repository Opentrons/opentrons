import * as React from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  LiquidIcon,
  NO_WRAP,
  POSITION_ABSOLUTE,
  SPACING,
  StyledText,
  useOnClickOutside,
} from '@opentrons/components'
import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
import * as labwareIngredActions from '../../labware-ingred/actions'
import type { ThunkDispatch } from '../../types'

const NAV_HEIGHT = '64px'

interface LiquidsOverflowMenuProps {
  onClose: () => void
}

export function LiquidsOverflowMenu(
  props: LiquidsOverflowMenuProps
): JSX.Element {
  const { onClose } = props
  const { t } = useTranslation(['starting_deck_state'])
  const liquids = useSelector(labwareIngredSelectors.allIngredientNamesIds)
  const dispatch: ThunkDispatch<any> = useDispatch()
  const [showDefineLiquidModal, setDefineLiquidModal] = React.useState<boolean>(
    false
  )
  const overflowWrapperRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => {
      if (!showDefineLiquidModal) {
        onClose()
      }
    },
  })

  return (
    <Flex
      position={POSITION_ABSOLUTE}
      right="50px"
      top={`calc(${NAV_HEIGHT} - 6px)`}
      whiteSpace={NO_WRAP}
      ref={overflowWrapperRef}
      borderRadius={BORDERS.borderRadius8}
      boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
      backgroundColor={COLORS.white}
      flexDirection={DIRECTION_COLUMN}
      onClick={(e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      {liquids.map(({ name, displayColor, ingredientId }) => {
        return (
          <MenuButton
            data-testid={`${name}_${ingredientId}`}
            onClick={() => {
              setDefineLiquidModal(true)
              onClose()
              dispatch(labwareIngredActions.selectLiquidGroup(ingredientId))
            }}
            key={ingredientId}
          >
            <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing8}>
              <LiquidIcon color={displayColor ?? ''} />
              <StyledText desktopStyle="bodyDefaultRegular">{name}</StyledText>
            </Flex>
          </MenuButton>
        )
      })}
      <Box width="100%" border={`1px solid ${COLORS.grey20}`} />
      <MenuButton
        data-testid="defineLiquid"
        onClick={() => {
          setDefineLiquidModal(true)
          onClose()
          dispatch(labwareIngredActions.createNewLiquidGroup())
        }}
        key="defineLiquid"
      >
        <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing4}>
          <Icon name="plus" size="1rem" />
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('define_liquid')}
          </StyledText>
        </Flex>
      </MenuButton>
    </Flex>
  )
}
const MenuButton = styled.button`
  background-color: ${COLORS.transparent};
  cursor: pointer;
  padding: ${SPACING.spacing8} ${SPACING.spacing12};
  border: none;
  &:hover {
    background-color: ${COLORS.blue10};
  }
  &:disabled {
    color: ${COLORS.grey40};
    cursor: auto;
  }
`
