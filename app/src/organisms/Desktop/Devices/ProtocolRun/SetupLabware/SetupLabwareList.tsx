import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'
import {
  getLabwareInfoByLiquidId,
  getModuleType,
  getSlotDisplayNameFromAAWithFakes,
  getStackedItemsOnStartingDeck,
  VACUUM_MODULE_DOCK_A4_ADDRESSABLE_AREA,
  VACUUM_MODULE_TYPE,
} from '@opentrons/shared-data'

import { getOffDeckRenderGroups } from '/app/resources/protocols/utils/getOffDeckRenderGroups'

import { LabwareListItem } from './LabwareListItem'
import { SlotDetailModal } from './SlotDetailModal'

import type {
  CompletedProtocolAnalysis,
  ProtocolAnalysisOutput,
  StackItem,
} from '@opentrons/shared-data'
import type { ModuleRenderInfoForProtocol } from '/app/resources/runs'
import type { ModuleTypesThatRequireExtraAttention } from '../utils/getModuleTypesThatRequireExtraAttention'

interface SetupLabwareListProps {
  attachedModuleInfo: { [moduleId: string]: ModuleRenderInfoForProtocol }
  protocolAnalysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput | null
  extraAttentionModules: ModuleTypesThatRequireExtraAttention[]
  isFlex: boolean
}
export function SetupLabwareList(
  props: SetupLabwareListProps
): JSX.Element | null {
  const {
    attachedModuleInfo,
    protocolAnalysis,
    extraAttentionModules,
    isFlex,
  } = props
  const { t } = useTranslation('protocol_setup')
  const [selectedStack, setSelectedStack] = useState<{
    slotName: string
    stack: StackItem[]
  } | null>(null)
  const startingDeck = useMemo(
    () =>
      getStackedItemsOnStartingDeck(
        protocolAnalysis?.commands ?? [],
        protocolAnalysis?.labware ?? [],
        protocolAnalysis?.modules ?? []
      ),
    [protocolAnalysis]
  )
  const labwareByLiquidId = getLabwareInfoByLiquidId(
    protocolAnalysis?.commands ?? []
  )
  const sortedStartingDeckEntries = Object.entries(startingDeck)
    .filter(([key]) => key !== 'offDeck')
    .flatMap(([location, stacks]) =>
      stacks
        .filter(stack => stack.some(item => 'labwareId' in item))
        .map(stack => ({ location, stack }))
    )
    .sort((a, b) => a.location.localeCompare(b.location))
  const vacuumDockSlotName = getSlotDisplayNameFromAAWithFakes(
    VACUUM_MODULE_DOCK_A4_ADDRESSABLE_AREA
  )
  const hasVacuumModule = (protocolAnalysis?.modules ?? []).some(
    m => getModuleType(m.model) === VACUUM_MODULE_TYPE
  )
  const offDeckItems = useMemo(
    () =>
      protocolAnalysis != null
        ? getOffDeckRenderGroups(
            startingDeck,
            protocolAnalysis,
            labwareByLiquidId
          )
        : [],
    [startingDeck, protocolAnalysis, labwareByLiquidId]
  )

  return (
    <>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing4}
        marginBottom={SPACING.spacing16}
      >
        <Flex
          gridGap={SPACING.spacing16}
          paddingLeft={SPACING.spacing16}
          paddingTop={SPACING.spacing20}
        >
          <StyledText
            width="6.25rem"
            desktopStyle="bodyDefaultRegular"
            color={COLORS.grey60}
          >
            {t('location')}
          </StyledText>
          <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
            {t('labware_name')}
          </StyledText>
        </Flex>
        {sortedStartingDeckEntries.map(({ location, stack }, index) => (
          <LabwareListItem
            key={`${location}_${index}`}
            attachedModuleInfo={attachedModuleInfo}
            extraAttentionModules={extraAttentionModules}
            isFlex={isFlex}
            slotName={location}
            stackedItems={stack}
            labwareByLiquidId={labwareByLiquidId}
            onClick={() => {
              setSelectedStack({ slotName: location, stack })
            }}
            {...(hasVacuumModule && location === vacuumDockSlotName
              ? { moduleTypeOverride: VACUUM_MODULE_TYPE }
              : {})}
          />
        ))}
        {offDeckItems?.map((item, index) => (
          <LabwareListItem
            key={index}
            attachedModuleInfo={attachedModuleInfo}
            extraAttentionModules={extraAttentionModules}
            slotName={'offDeck'}
            stackedItems={[item.representativeItem]}
            offDeckQuantity={item.quantity}
            isFlex={isFlex}
            onClick={() => {
              setSelectedStack({
                slotName: 'offDeck',
                stack: item.stackedItems,
              })
            }}
          />
        ))}
      </Flex>
      {selectedStack != null && protocolAnalysis != null ? (
        <SlotDetailModal
          stackedItems={selectedStack.stack}
          slotName={selectedStack.slotName}
          labwareByLiquidId={labwareByLiquidId}
          mostRecentAnalysis={protocolAnalysis}
          closeModal={() => {
            setSelectedStack(null)
          }}
          isFlex={isFlex}
        />
      ) : null}
    </>
  )
}
