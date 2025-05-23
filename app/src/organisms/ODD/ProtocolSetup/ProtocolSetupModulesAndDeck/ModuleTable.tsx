import { useSelector } from 'react-redux'

import {
  getCutoutFixturesForModuleModel,
  getCutoutIdsFromModuleSlotName,
  MAGNETIC_BLOCK_TYPE,
} from '@opentrons/shared-data'

import { getLocalRobot } from '/app/redux/discovery'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'
import {
  useChainLiveCommands,
  useRunCalibrationStatus,
} from '/app/resources/runs'

import { ModuleTableItem } from './ModuleTableItem'

import type { DeckDefinition } from '@opentrons/shared-data'
import type { AttachedProtocolModuleMatch } from '/app/transformations/analysis'

const DECK_CONFIG_REFETCH_INTERVAL = 5000

interface ModuleTableProps {
  attachedProtocolModuleMatches: AttachedProtocolModuleMatch[]
  deckDef: DeckDefinition
  runId: string
}

export function ModuleTable(props: ModuleTableProps): JSX.Element {
  const { attachedProtocolModuleMatches, deckDef, runId } = props

  const { data: deckConfig } = useNotifyDeckConfigurationQuery({
    refetchInterval: DECK_CONFIG_REFETCH_INTERVAL,
  })
  const localRobot = useSelector(getLocalRobot)
  const robotName: string = localRobot?.name ?? ''
  const calibrationStatus = useRunCalibrationStatus(robotName, runId)
  const { chainLiveCommands } = useChainLiveCommands()

  return (
    <>
      {attachedProtocolModuleMatches
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
