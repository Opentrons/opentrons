import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_CENTER,
  LabwareRender,
  Modal,
  RobotInfoLabel,
  RobotWorkSpace,
  SPACING,
  StyledText,
  Tag,
} from '@opentrons/components'
import { FLEX_STACKER_MODULE_V1 } from '@opentrons/shared-data'
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
import { getIsAdapterFromDef } from '/protocol-designer/utils'

import { LabwareButtonBasket } from '../../molecules'
import { WellTooltip } from '../Labware/WellTooltip'
import { getMainPagePortalEl } from '../Portal'
import { LiquidCardList } from './LiquidCardList'
import { getDeckLabel } from './utils'

import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'
import type { WellGroup } from '@opentrons/components'

export interface WellContentsByNumber {
  [wellName: string]: number
}

interface SlotDetailModalProps {
  closeModal: () => void
  stackOfLabware: string[]
}

export const SlotDetailModal = (props: SlotDetailModalProps): ReactNode => {
  const { closeModal, stackOfLabware } = props
  const { t } = useTranslation('protocol_steps')
  const [selectedLabware, setSelectedLabware] = useState<string>(
    stackOfLabware[0] ?? ''
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
  const { labware, modules } = activeDeckSetup
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

  const [selectedLiquidId, setSelectedLiquidId] = useState<string | undefined>(
    individualIds.length > 0 ? individualIds[0] : undefined
  )

  const wellContentsWithLiquidId: WellGroup =
    wellContents != null && selectedLiquidId != null
      ? Object.values(wellContents).reduce((acc: WellGroup, wellContents) => {
          if (wellContents.groupIds.includes(selectedLiquidId)) {
            acc[wellContents.wellName ?? 'A1'] = null
          }
          return acc
        }, {})
      : {}

  if (stackOfLabware.length === 0 || labwareOnDeck == null) {
    return null
  }

  const isAdapter = getIsAdapterFromDef(labwareOnDeck.def)
  const slotName = getSlotInLocationStack(labwareOnDeck.stack)
  const isHopper = Object.values(modules).some(
    ({ slot, model }) => slot === slotName && model === FLEX_STACKER_MODULE_V1
  )
  const isVacuumDock = labwareOnDeck.stack.includes('vacuumDock')

  const modalTitle = (
    <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing4}>
      <StyledText desktopStyle="bodyLargeSemiBold">
        {t('labware_in')}
      </StyledText>
      <RobotInfoLabel
        deckLabel={getDeckLabel(
          slotName,
          isHopper,
          isVacuumDock,
          t as TFunction
        )}
      />
    </Flex>
  )

  return createPortal(
    <Modal
      // this z-index should be a temporary fix for 8.6.0
      zIndexOverlay={1001}
      title={modalTitle}
      hasHeader
      onClose={closeModal}
      closeOnOutsideClick
      childrenPadding={0}
      width="47rem"
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
        height="28rem"
      >
        <Flex
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacing24}
          height="28rem"
        >
          {stackOfLabware.length > 1 ? (
            <LabwareButtonBasket
              stackOfLabware={stackOfLabware}
              selectedLabware={[selectedLabware]}
              labware={labware}
              setSelectedLabware={(selectedLabwareId: string) => {
                const wellContentsForNewlySelected =
                  allWellContentsForActiveItem != null
                    ? allWellContentsForActiveItem[selectedLabwareId]
                    : null

                const individualIdsForNewlySelected = getLiquidIdsOnLabware(
                  wellContentsForNewlySelected
                )

                setSelectedLabware(selectedLabwareId)
                setSelectedLiquidId(
                  individualIdsForNewlySelected[0] ?? undefined
                )
              }}
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
              {() =>
                isAdapter ? (
                  <g>
                    <LabwareRender
                      definition={labwareOnDeck.def}
                      positioningMode="passThrough"
                    />
                  </g>
                ) : (
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
                          positioningMode="passThrough"
                          wellFill={allWellFill}
                          highlightedWells={wellContentsWithLiquidId}
                        />
                      </g>
                    )}
                  </WellTooltip>
                )
              }
            </RobotWorkSpace>
          </Flex>
          {!isAdapter && selectedLiquidId != null ? (
            <LiquidCardList
              selectedLabware={labwareOnDeck}
              selectedLiquidId={selectedLiquidId}
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
