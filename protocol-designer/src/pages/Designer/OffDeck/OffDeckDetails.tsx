import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import styled from 'styled-components'

import {
  ALIGN_CENTER,
  ALIGN_START,
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  EmptySelectorButton,
  Flex,
  JUSTIFY_CENTER,
  JUSTIFY_FLEX_END,
  LabwareRender,
  OVERFLOW_AUTO,
  RobotWorkSpace,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { getLabwareViewBox } from '@opentrons/shared-data'
import {
  getSlotInLocationStack,
  wellFillFromWellContents,
} from '@opentrons/step-generation'

import { SlotDetailsContainer } from '../../../components/organisms'
import { getRobotType } from '../../../file-data/selectors'
import { selectors } from '../../../labware-ingred/selectors'
import { START_TERMINAL_ITEM_ID } from '../../../steplist'
import { getDeckSetupForActiveItem } from '../../../top-selectors/labware-locations'
import * as wellContentsSelectors from '../../../top-selectors/well-contents'
import { SlotOverflowMenu } from '../DeckSetup/SlotOverflowMenu'
import { HighlightOffDeckSlot } from './HighlightOffDeckSlot'
import { OffDeckControls } from './OffDeckControls'

import type { ReactNode } from 'react'
import type { CoordinateTuple, DeckSlotId } from '@opentrons/shared-data'
import type { DeckSetupTerminalIdType } from '../types'

const OFF_DECK_MAP_WIDTH = '41.625rem'
const OFF_DECK_MAP_HEIGHT_FOR_STEP = '30.3rem'
const ZERO_SLOT_POSITION: CoordinateTuple = [0, 0, 0]
interface OffDeckDetailsProps extends DeckSetupTerminalIdType {
  addLabware: (id: string | null) => void
}
export function OffDeckDetails(props: OffDeckDetailsProps): ReactNode {
  const { addLabware, terminalItemId } = props
  const { t, i18n } = useTranslation('starting_deck_state')
  const [hoverSlot, setHoverSlot] = useState<DeckSlotId | null>(null)
  const [menuListId, setShowMenuListForId] = useState<DeckSlotId | null>(null)
  const robotType = useSelector(getRobotType)
  const deckSetup = useSelector(getDeckSetupForActiveItem)
  const offDeckLabware = Object.values(deckSetup.labware).filter(
    lw => getSlotInLocationStack(lw.stack) === 'offDeck'
  )
  const liquidDisplayColors = useSelector(selectors.getLiquidDisplayColors)
  const allWellContentsForActiveItem = useSelector(
    wellContentsSelectors.getAllWellContentsForActiveItem
  )

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing20}>
      <Flex
        backgroundColor={COLORS.white}
        borderRadius={BORDERS.borderRadius12}
        padding={SPACING.spacing40}
        gridGap={SPACING.spacing24}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_FLEX_END}
      >
        <Flex
          flex="0 0 auto"
          width={OFF_DECK_MAP_WIDTH}
          maxHeight={OFF_DECK_MAP_HEIGHT_FOR_STEP}
          minHeight={OFF_DECK_MAP_HEIGHT_FOR_STEP}
          alignItems={ALIGN_CENTER}
          borderRadius={SPACING.spacing12}
          padding={`${SPACING.spacing16} ${SPACING.spacing40}`}
          backgroundColor={COLORS.grey20}
          overflowY={OVERFLOW_AUTO}
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing40}
        >
          <Flex justifyContent={JUSTIFY_CENTER} color={COLORS.grey60}>
            <StyledText desktopStyle="bodyDefaultSemiBold">
              {i18n.format(t('off_deck_labware'), 'upperCase')}
            </StyledText>
          </Flex>
          <LabwareWrapper>
            {terminalItemId === START_TERMINAL_ITEM_ID ? (
              <Flex width="9.5625rem" height="6.375rem">
                <EmptySelectorButton
                  onClick={() => {
                    addLabware(null)
                  }}
                  text={t('add_labware')}
                  textAlignment="middle"
                  iconName="plus"
                />
              </Flex>
            ) : null}
            {offDeckLabware.map(lw => {
              const wellContents = allWellContentsForActiveItem
                ? allWellContentsForActiveItem[lw.id]
                : null
              const definition = lw.def
              const viewBox = getLabwareViewBox(definition)

              return (
                <Flex id={lw.id} flexDirection={DIRECTION_COLUMN} key={lw.id}>
                  <RobotWorkSpace
                    key={lw.id}
                    viewBox={`${viewBox.minX} ${viewBox.minY} ${viewBox.xDimension} ${viewBox.yDimension}`}
                    width="9.5625rem"
                    height="6.375rem"
                  >
                    {() => (
                      <>
                        <LabwareRender
                          definition={definition}
                          positioningMode="passThrough"
                          wellFill={wellFillFromWellContents(
                            wellContents,
                            liquidDisplayColors
                          )}
                        />

                        <OffDeckControls
                          hover={hoverSlot}
                          setShowMenuListForId={setShowMenuListForId}
                          menuListId={menuListId}
                          setHover={setHoverSlot}
                          slotBoundingBox={{
                            x: viewBox.xDimension,
                            y: viewBox.yDimension,
                          }}
                          slotPosition={{ x: viewBox.minX, y: viewBox.minY }}
                          labwareId={lw.id}
                          terminalItemId={terminalItemId}
                        />
                      </>
                    )}
                  </RobotWorkSpace>
                  <HighlightOffDeckSlot
                    labwareOnDeck={lw}
                    position={ZERO_SLOT_POSITION}
                  />
                  {menuListId === lw.id ? (
                    <Flex
                      marginTop={`-${SPACING.spacing32}`}
                      marginLeft="4rem"
                      zIndex={3}
                    >
                      <SlotOverflowMenu
                        location={menuListId}
                        addEquipment={addLabware}
                        setShowMenuList={() => {
                          setShowMenuListForId(null)
                        }}
                        menuListSlotPosition={ZERO_SLOT_POSITION}
                        invertY
                      />
                    </Flex>
                  ) : null}
                </Flex>
              )
            })}
            <HighlightOffDeckSlot position={ZERO_SLOT_POSITION} />
          </LabwareWrapper>
        </Flex>
      </Flex>
      {hoverSlot != null && terminalItemId === START_TERMINAL_ITEM_ID ? (
        <Flex>
          <SlotDetailsContainer
            robotType={robotType}
            slot="offDeck"
            offDeckLabwareId={hoverSlot}
          />
        </Flex>
      ) : null}
    </Flex>
  )
}

const LabwareWrapper = styled(Box)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9.5625rem, 1fr));
  row-gap: ${SPACING.spacing40};
  column-gap: ${SPACING.spacing32};
  justify-content: ${JUSTIFY_CENTER}; /* Center the grid within the container */
  align-items: ${ALIGN_START};
  width: 100%;
  // Note(kk: 1/30/2025) this padding is to add space to the right edge and the left edge of the grid
  // this is not a perfect solution, but it works for now
  padding: 0 ${SPACING.spacing24};
`
