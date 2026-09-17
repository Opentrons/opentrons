import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

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
  SPACING,
  StyledText,
  Tag,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  getLabwareDefinitionsByURIForProtocol,
  getLabwareViewBox,
  getWellFillFromLabwareId,
  parseLiquidsInLoadOrder,
} from '@opentrons/shared-data'

import { LabwareStackContents } from '/app/molecules/LabwareStackContents'
import { LiquidCardList } from '/app/molecules/LiquidDetailCard'
import {
  getDisabledWellGroupForLiquidId,
  getLiquidsByIdForLabware,
  getWellGroupForLiquidId,
} from '/app/transformations/analysis'

import type {
  CompletedProtocolAnalysis,
  LabwareByLiquidId,
  LabwareInStack,
  ProtocolAnalysisOutput,
  StackItem,
} from '@opentrons/shared-data'

interface SlotDetailModalProps {
  closeModal: () => void
  slotName: string
  stackedItems: StackItem[]
  labwareByLiquidId: LabwareByLiquidId
  mostRecentAnalysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput
  isFlex?: boolean
}

const LabwareThumbnail = styled.svg`
  transform: scale(1, -1);
  flex-shrink: 0;
`

export function SlotDetailModal(
  props: SlotDetailModalProps
): JSX.Element | null {
  const {
    closeModal,
    slotName,
    stackedItems,
    labwareByLiquidId,
    mostRecentAnalysis: protocolData,
    isFlex,
  } = props
  const { t, i18n } = useTranslation('protocol_setup')
  const definitionsByURI = useMemo(
    () => getLabwareDefinitionsByURIForProtocol(protocolData.commands),
    [protocolData]
  )

  const labwareInStack = stackedItems.filter(
    (lw): lw is LabwareInStack => 'labwareId' in lw
  )
  const firstDefUri = labwareInStack[0].definitionUri
  const isVariedStack = !labwareInStack.every(
    lw => lw.definitionUri === firstDefUri
  )
  const [selectedLabware, setSelectedLabware] = useState(labwareInStack[0])
  const wellFill = getWellFillFromLabwareId(
    selectedLabware.labwareId,
    protocolData.liquids,
    labwareByLiquidId,
    protocolData.commands
  )

  const labwareDefinition = definitionsByURI[selectedLabware.definitionUri]
  const labwareViewBox = getLabwareViewBox(labwareDefinition)

  const commands = protocolData?.commands ?? []
  const liquids = parseLiquidsInLoadOrder(
    protocolData?.liquids != null ? protocolData?.liquids : [],
    commands
  )
  const liquidsByIdForLabware = getLiquidsByIdForLabware(
    selectedLabware.labwareId,
    labwareByLiquidId
  )
  const filteredLiquidsInLoadOrder = liquids.filter(liquid => {
    return Object.keys(liquidsByIdForLabware).some(key => key === liquid.id)
  })
  const [selectedLiquidId, setSelectedLiquidId] = useState<string | undefined>(
    filteredLiquidsInLoadOrder.length > 0
      ? filteredLiquidsInLoadOrder[0].id
      : undefined
  )

  useEffect(
    () => {
      setSelectedLiquidId(
        filteredLiquidsInLoadOrder.length > 0
          ? filteredLiquidsInLoadOrder[0].id
          : undefined
      )
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedLabware]
  )

  if (protocolData == null) return null
  const liquidIds = filteredLiquidsInLoadOrder.map(liquid => liquid.id)
  const disabledLiquidIds = liquidIds.filter(id => id !== selectedLiquidId)

  const labwareRender = (
    <LabwareRender
      definition={labwareDefinition}
      positioningMode="passThrough"
      wellFill={wellFill}
      wellLabelOption="SHOW_LABEL_INSIDE"
      highlightedWells={
        selectedLiquidId != null &&
        Object.entries(liquidsByIdForLabware).length > 0
          ? getWellGroupForLiquidId(liquidsByIdForLabware, selectedLiquidId)
          : {}
      }
      disabledWells={
        selectedLiquidId != null &&
        Object.entries(liquidsByIdForLabware).length > 0
          ? getDisabledWellGroupForLiquidId(
              liquidsByIdForLabware,
              disabledLiquidIds
            )
          : []
      }
    />
  )
  const slotDisplayName =
    slotName === 'offDeck'
      ? i18n.format(t('protocol_command_text:off_deck'), 'upperCase')
      : slotName
  const modalTitle = (
    <Flex alignItems={ALIGN_CENTER} gap={SPACING.spacing4}>
      <StyledText desktopStyle="bodyLargeSemiBold">
        {t('labware_in')}
      </StyledText>
      {isFlex ? (
        <RobotInfoLabel deckLabel={slotDisplayName} />
      ) : (
        <StyledText>{slotDisplayName}</StyledText>
      )}
    </Flex>
  )
  const stackedTag = (
    <>
      {labwareInStack.length > 1 ? (
        <Tag
          text={t('total_stacked', { quantity: labwareInStack.length })}
          type="default"
        />
      ) : null}
    </>
  )

  return (
    <Modal
      title={modalTitle}
      headerTagElement={stackedTag}
      hasHeader
      onClose={closeModal}
      closeOnOutsideClick
      childrenPadding={0}
      width={isVariedStack || selectedLiquidId != null ? '47rem' : '31.25rem'}
      overflowY="hidden"
    >
      <Box
        backgroundColor={COLORS.grey10}
        padding={SPACING.spacing16}
        height={selectedLiquidId != null || isVariedStack ? '28rem' : '25rem'}
      >
        <Flex flexDirection={DIRECTION_ROW} gap={SPACING.spacing24}>
          {isVariedStack ? (
            <LabwareStackContents
              labwareInStack={labwareInStack}
              selectedLabware={selectedLabware}
              setSelectedLabware={setSelectedLabware}
              height="26rem"
            />
          ) : null}
          <Flex
            flexDirection={DIRECTION_COLUMN}
            height="24rem"
            gap={SPACING.spacing16}
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_CENTER}
            width={isVariedStack ? '' : '100%'}
          >
            <Flex flexDirection={DIRECTION_COLUMN} alignItems={ALIGN_CENTER}>
              <StyledText
                desktopStyle="bodyDefaultSemiBold"
                fontWeight={TYPOGRAPHY.fontWeightRegular}
              >
                {selectedLabware.displayName}
              </StyledText>
              {selectedLabware.lidDisplayName != null ? (
                <StyledText
                  desktopStyle="bodyDefaultRegular"
                  fontWeight={TYPOGRAPHY.fontWeightRegular}
                  color={COLORS.grey60}
                >
                  {selectedLabware.lidDisplayName}
                </StyledText>
              ) : null}
            </Flex>
            <LabwareThumbnail
              viewBox={`${labwareViewBox.minX} ${labwareViewBox.minY} ${labwareViewBox.xDimension} ${labwareViewBox.yDimension}`}
              width={
                selectedLiquidId != null && isVariedStack ? '20rem' : '29rem'
              }
            >
              {labwareRender}
            </LabwareThumbnail>
          </Flex>
          {selectedLiquidId != null ? (
            <LiquidCardList
              selectedLabwareDefinition={labwareDefinition}
              selectedLiquidId={selectedLiquidId ?? ''}
              setSelectedLiquidId={setSelectedLiquidId}
              liquidsInLoadOrder={filteredLiquidsInLoadOrder}
              liquidsByIdForLabware={liquidsByIdForLabware}
            />
          ) : null}
        </Flex>
      </Box>
    </Modal>
  )
}
