import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  Box,
  COLORS,
  DeckInfoLabel,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_CENTER,
  LabwareRender,
  Modal,
  RobotWorkSpace,
  SPACING,
  StyledText,
  Tag,
} from '@opentrons/components'
import {
  getLiquidIdsOnLabware,
  getSlotInLocationStack,
  getVolumesPerLiquid,
  wellFillFromWellContents,
} from '@opentrons/step-generation'

import { selectors } from '/protocol-designer/labware-ingred/selectors'
import { getDeckSetupForActiveItem } from '/protocol-designer/top-selectors/labware-locations'
import * as wellContentsSelectors from '/protocol-designer/top-selectors/well-contents'
import { getLabwareNicknamesById } from '/protocol-designer/ui/labware/selectors'

import { LabwareButtonBasket } from '../../molecules'
import { WellTooltip } from '../Labware/WellTooltip'
import { getMainPagePortalEl } from '../Portal'
import { LiquidCardList } from './LiquidCardList'

import type { WellGroup } from '@opentrons/components'

export interface WellContentsByNumber {
  [wellName: string]: number
}

interface SlotDetailModalProps {
  closeModal: () => void
  stackOfLabware: string[]
}

export const SlotDetailModal = (
  props: SlotDetailModalProps
): JSX.Element | null => {
  const { closeModal, stackOfLabware } = props
  const { t } = useTranslation('protocol_steps')
  const [selectedLabware, setSelectedLabware] = useState<string>(
    stackOfLabware[0]
  )
  const activeDeckSetup = useSelector(getDeckSetupForActiveItem)
  const nickNames = useSelector(getLabwareNicknamesById)
  const allWellContentsForActiveItem = useSelector(
    wellContentsSelectors.getAllWellContentsForActiveItem
  )
  const ingredNames = useSelector(selectors.getLiquidNamesById)
  const liquidDisplayColors = useSelector(selectors.getLiquidDisplayColors)
  const allIngredientGroupFields = useSelector(
    selectors.allIngredientGroupFields
  )
  const { labware } = activeDeckSetup
  const labwareOnDeck = labware[selectedLabware]
  const wellContents =
    allWellContentsForActiveItem != null
      ? allWellContentsForActiveItem[selectedLabware]
      : null
  const allWellFill = wellFillFromWellContents(
    wellContents,
    liquidDisplayColors
  )
  const individualIds = getLiquidIdsOnLabware(wellContents)

  const volumesPerLiquid = getVolumesPerLiquid(wellContents, individualIds)
  const ingedInputs = Object.values(allIngredientGroupFields)
  const wellFill = Object.values(allWellFill)

  const [selectedLiquidId, setSelectedLiquidId] = useState<string | undefined>(
    undefined
  )

  useEffect(() => {
    if (wellFill.length > 0) {
      const match = ingedInputs.find(ingred =>
        wellFill.includes(ingred.displayColor)
      )
      if (match) {
        setSelectedLiquidId(match.liquidGroupId)
      } else if (ingedInputs[0]) {
        setSelectedLiquidId(ingedInputs[0].liquidGroupId)
      }
    } else {
      setSelectedLiquidId(undefined)
    }
  }, [selectedLabware, wellFill, ingedInputs])

  const wellContentsWithLiquidId: WellGroup =
    wellContents != null && selectedLiquidId != null
      ? Object.values(wellContents).reduce((acc: WellGroup, wellContents) => {
          if (wellContents.groupIds.includes(selectedLiquidId)) {
            acc[wellContents.wellName ?? 'A1'] = null
          }
          return acc
        }, {})
      : {}

  const slotName = getSlotInLocationStack(labwareOnDeck.stack)
  const modalTitle = (
    <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing4}>
      <StyledText desktopStyle="bodyLargeSemiBold">
        {t('labware_in')}
      </StyledText>
      <DeckInfoLabel
        deckLabel={slotName === 'offDeck' ? t('off_deck') : slotName}
      />
    </Flex>
  )

  return createPortal(
    <Modal
      title={modalTitle}
      hasHeader
      onClose={closeModal}
      closeOnOutsideClick
      childrenPadding={0}
      width={
        selectedLiquidId != null || stackOfLabware.length > 1
          ? '47rem'
          : '31.25rem'
      }
      overflowY="hidden"
      headerTagElement={
        stackOfLabware.length > 1 ? (
          <Tag
            text={t('total_stacked', { amount: stackOfLabware.length })}
            type="default"
          />
        ) : undefined
      }
    >
      <Box
        backgroundColor={COLORS.grey10}
        padding={SPACING.spacing16}
        height={selectedLiquidId != null ? '28rem' : '25rem'}
      >
        <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing24}>
          {stackOfLabware.length > 1 ? (
            <LabwareButtonBasket
              stackOfLabware={stackOfLabware}
              selectedLabware={selectedLabware}
              labware={labware}
              setSelectedLabware={setSelectedLabware}
            />
          ) : null}
          <Flex
            flexDirection={DIRECTION_COLUMN}
            height="24rem"
            gridGap={SPACING.spacing16}
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_CENTER}
            width="100%"
          >
            <Flex flexDirection={DIRECTION_COLUMN} alignItems={ALIGN_CENTER}>
              <StyledText desktopStyle="bodyDefaultRegular">
                {nickNames[selectedLabware]}
              </StyledText>
            </Flex>
            <RobotWorkSpace
              key={labwareOnDeck.def.parameters.loadName}
              viewBox={`0 0 ${labwareOnDeck.def.dimensions.xDimension} ${labwareOnDeck.def.dimensions.yDimension}`}
            >
              {() => (
                <WellTooltip ingredNames={ingredNames}>
                  {({ makeHandleMouseEnterWell, handleMouseLeaveWell }) => (
                    <g>
                      <LabwareRender
                        onMouseLeaveWell={mouseEventArgs => {
                          handleMouseLeaveWell(mouseEventArgs)
                          handleMouseLeaveWell(mouseEventArgs.event)
                        }}
                        onMouseEnterWell={({ wellName, event }) => {
                          if (wellContents !== null) {
                            makeHandleMouseEnterWell(
                              wellName,
                              wellContents[wellName]?.ingreds
                            )(event)
                          }
                        }}
                        definition={labwareOnDeck.def}
                        positioningMode="offsetInSlot"
                        wellFill={allWellFill}
                        highlightedWells={wellContentsWithLiquidId}
                      />
                    </g>
                  )}
                </WellTooltip>
              )}
            </RobotWorkSpace>
          </Flex>
          {selectedLiquidId != null ? (
            <LiquidCardList
              selectedLabware={labwareOnDeck}
              selectedLiquidId={selectedLiquidId ?? ''}
              setSelectedLiquidId={setSelectedLiquidId}
              allIngredGroupFields={allIngredientGroupFields}
              individualIds={individualIds}
              volumesPerLiquid={volumesPerLiquid}
            />
          ) : null}
        </Flex>
      </Box>
    </Modal>,
    getMainPagePortalEl()
  )
}
