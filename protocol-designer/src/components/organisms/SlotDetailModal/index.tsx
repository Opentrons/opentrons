import { useState } from 'react'
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
} from '@opentrons/components'
import {
  getFullStackFromLabwares,
  getSlotInLocationStack,
} from '@opentrons/step-generation'

import { selectors } from '../../../labware-ingred/selectors'
import { getDeckSetupForActiveItem } from '../../../top-selectors/labware-locations'
import * as wellContentsSelectors from '../../../top-selectors/well-contents'
import { getLabwareNicknamesById } from '../../../ui/labware/selectors'
import { wellFillFromWellContents } from '../LabwareOnDeck/utils'
import { getMainPagePortalEl } from '../Portal'
import { getLiquidIdsOnLabware } from '../utils'
import { LiquidCardList } from './LiquidCardList'

import type { WellGroup } from '@opentrons/components'

export interface WellContentsByNumber {
  [wellName: string]: number
}

interface SlotDetailModalProps {
  closeModal: () => void
  // slotId or labwareId for off-deck labware
  itemId: string
}

export const SlotDetailModal = (
  props: SlotDetailModalProps
): JSX.Element | null => {
  const { closeModal, itemId } = props
  const { t } = useTranslation('protocol_steps')
  const activeDeckSetup = useSelector(getDeckSetupForActiveItem)
  const nickNames = useSelector(getLabwareNicknamesById)
  const allWellContentsForActiveItem = useSelector(
    wellContentsSelectors.getAllWellContentsForActiveItem
  )
  const liquidDisplayColors = useSelector(selectors.getLiquidDisplayColors)
  const allIngredientGroupFields = useSelector(
    selectors.allIngredientGroupFields
  )
  const { labware } = activeDeckSetup
  const fullStackFromLabwares =
    labware[itemId] != null
      ? labware[itemId].stack
      : getFullStackFromLabwares(labware, itemId)
  const labwareId = fullStackFromLabwares[0]
  const labwareOnDeck = labware[labwareId]
  const wellContents =
    allWellContentsForActiveItem != null
      ? allWellContentsForActiveItem[labwareId]
      : null

  const allWellFill = wellFillFromWellContents(
    wellContents,
    liquidDisplayColors
  )
  const individualIds = getLiquidIdsOnLabware(wellContents)

  const [selectedLiquidId, setSelectedLiquidId] = useState<string | undefined>(
    Object.values(allWellFill).length > 0
      ? Object.values(allIngredientGroupFields).find(
          ingred => ingred.displayColor === Object.values(allWellFill)[0]
        )?.liquidGroupId
      : undefined
  )
  const wellContentsWithLiquidId: WellGroup =
    wellContents != null && selectedLiquidId != null
      ? Object.values(wellContents).reduce((acc: WellGroup, wellContents) => {
          if (wellContents.groupIds[0] === selectedLiquidId) {
            acc[wellContents.wellName ?? 'A1'] = null
          }
          return acc
        }, {})
      : {}

  const volumeByWell: WellContentsByNumber =
    wellContents != null && selectedLiquidId != null
      ? Object.values(wellContents).reduce((acc: WellContentsByNumber, wc) => {
          if (wc.groupIds[0] === selectedLiquidId) {
            acc[wc.wellName ?? 'A1'] = Object.values(wc.ingreds)[0].volume
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
      width={selectedLiquidId != null ? '47rem' : '31.25rem'}
      overflowY="hidden"
    >
      <Box
        backgroundColor={COLORS.grey10}
        padding={SPACING.spacing16}
        height={selectedLiquidId != null ? '28rem' : '25rem'}
      >
        <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing24}>
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
                {nickNames[labwareId]}
              </StyledText>
            </Flex>
            <RobotWorkSpace
              key={labwareOnDeck.def.parameters.loadName}
              viewBox={`0 0 ${labwareOnDeck.def.dimensions.xDimension} ${labwareOnDeck.def.dimensions.yDimension}`}
            >
              {() => (
                <g>
                  <LabwareRender
                    definition={labwareOnDeck.def}
                    wellFill={allWellFill}
                    highlightedWells={wellContentsWithLiquidId}
                  />
                </g>
              )}
            </RobotWorkSpace>
          </Flex>
          {selectedLiquidId != null ? (
            <LiquidCardList
              selectedLabwareDefinition={labwareOnDeck.def}
              selectedLiquidId={selectedLiquidId ?? ''}
              setSelectedLiquidId={setSelectedLiquidId}
              allIngredGroupFields={allIngredientGroupFields}
              individualIds={individualIds}
              volumeByWell={volumeByWell}
            />
          ) : null}
        </Flex>
      </Box>
    </Modal>,
    getMainPagePortalEl()
  )
}
