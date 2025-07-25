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
  getStackedItemsOnStartingDeck,
  getStacksWithLabware,
} from '@opentrons/shared-data'

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
  const stacksWithLaware = getStacksWithLabware(startingDeck)
  const sortedStartingDeckEntries = Object.entries(stacksWithLaware)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .filter(([key, value]) => key !== 'offDeck')
  const offDeckItems = Object.keys(stacksWithLaware).includes('offDeck')
    ? startingDeck.offDeck
    : null

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
        {sortedStartingDeckEntries.map(([key, value]) => {
          return (
            <LabwareListItem
              key={key}
              attachedModuleInfo={attachedModuleInfo}
              extraAttentionModules={extraAttentionModules}
              isFlex={isFlex}
              slotName={key}
              stackedItems={value}
              labwareByLiquidId={labwareByLiquidId}
              onClick={() => {
                setSelectedStack({ slotName: key, stack: value })
              }}
            />
          )
        })}
        {offDeckItems?.map((item, index) => (
          <LabwareListItem
            key={index}
            attachedModuleInfo={attachedModuleInfo}
            extraAttentionModules={extraAttentionModules}
            slotName={'offDeck'}
            stackedItems={[item]}
            isFlex={isFlex}
            onClick={() => {
              setSelectedStack({ slotName: 'offDeck', stack: [item] })
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
