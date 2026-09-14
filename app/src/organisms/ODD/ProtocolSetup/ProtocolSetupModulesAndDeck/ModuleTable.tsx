import { useSelector } from 'react-redux'

import {
  FLEX_STACKER_MODULE_TYPE,
  getCutoutFixturesForModuleModel,
  getCutoutIdsFromModuleSlotName,
  getFlexStackerD3Compatibility,
  MAGNETIC_BLOCK_TYPE,
} from '@opentrons/shared-data'

import { getLocalRobot } from '/app/redux/discovery'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'
import {
  useChainLiveCommands,
  useRunCalibrationStatus,
} from '/app/resources/runs'

import { ModuleTableItem } from './ModuleTableItem'

import type { ReactNode } from 'react'
import type {
  CutoutConfigAndCompatibility,
  DeckDefinition,
} from '@opentrons/shared-data'
import type { AttachedProtocolModuleMatch } from '/app/transformations/analysis'

const DECK_CONFIG_REFETCH_INTERVAL = 5000

interface ModuleTableProps {
  attachedProtocolModuleMatches: AttachedProtocolModuleMatch[]
  deckConfigCompatibility: CutoutConfigAndCompatibility[]
  deckDef: DeckDefinition
  runId: string
}

export function ModuleTable(props: ModuleTableProps): ReactNode {
  const {
    attachedProtocolModuleMatches,
    deckDef,
    runId,
    deckConfigCompatibility,
  } = props

  const attachedProtocolModuleMatchesSortedBySlotName =
    attachedProtocolModuleMatches.sort((a, b) =>
      a.slotName.localeCompare(b.slotName)
    )

  const { data: deckConfig } = useNotifyDeckConfigurationQuery({
    refetchInterval: DECK_CONFIG_REFETCH_INTERVAL,
  })
  const localRobot = useSelector(getLocalRobot)
  const robotName: string = localRobot?.name ?? ''
  const calibrationStatus = useRunCalibrationStatus(robotName, runId)
  const { chainLiveCommands } = useChainLiveCommands()

  return (
    <>
      {attachedProtocolModuleMatchesSortedBySlotName
        // filter out the magnetic block here, because it is a non-connected module
        // and is handled by the fixture table
        .filter(module => module.moduleDef.moduleType !== MAGNETIC_BLOCK_TYPE)
        .map(module => {
          const moduleFixtures = getCutoutFixturesForModuleModel(
            module.moduleDef.model,
            deckDef
          )
          const moduleCutoutIds = getCutoutIdsFromModuleSlotName(
            module.slotName,
            moduleFixtures,
            deckDef
          )
          // special case for waste chute and stacker combination fixture item
          if (
            module.moduleDef.moduleType === FLEX_STACKER_MODULE_TYPE &&
            module.slotName === 'D3'
          ) {
            const d3Compatibility = getFlexStackerD3Compatibility(
              deckConfigCompatibility
            )
            if (d3Compatibility) {
              const { comboFixtureId, comboFixtureConflict } = d3Compatibility
              return (
                <ModuleTableItem
                  key={module.moduleId}
                  module={module}
                  calibrationStatus={calibrationStatus}
                  chainLiveCommands={chainLiveCommands}
                  comboFixtureId={comboFixtureId}
                  conflictedFixture={
                    comboFixtureConflict
                      ? (deckConfigCompatibility.find(
                          configItem => configItem.cutoutId === 'cutoutD3'
                        ) ?? null)
                      : null
                  }
                  deckDef={deckDef}
                  robotName={robotName}
                />
              )
            }
          }
          const conflictedFixture =
            deckConfig?.find(
              ({ cutoutId, cutoutFixtureId }) =>
                moduleCutoutIds.includes(cutoutId) &&
                !moduleFixtures.some(({ id }) => cutoutFixtureId === id) &&
                module.attachedModuleMatch == null
            ) ?? null
          return (
            <ModuleTableItem
              key={module.moduleId}
              module={module}
              calibrationStatus={calibrationStatus}
              chainLiveCommands={chainLiveCommands}
              conflictedFixture={conflictedFixture}
              deckDef={deckDef}
              robotName={robotName}
            />
          )
        })}
    </>
  )
}
