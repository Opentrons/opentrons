import { useSelector } from 'react-redux'

import {
  FLEX_STACKER_MODULE_TYPE,
  getCutoutFixturesForModuleModel,
  getCutoutIdsFromModuleSlotName,
  MAGNETIC_BLOCK_TYPE,
  WASTE_CHUTE_FLEX_STACKER_FIXTURES,
} from '@opentrons/shared-data'

import { getLocalRobot } from '/app/redux/discovery'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'
import {
  useChainLiveCommands,
  useRunCalibrationStatus,
} from '/app/resources/runs'

import { ModuleTableItem } from './ModuleTableItem'

import type { DeckDefinition } from '@opentrons/shared-data'
import type { CutoutConfigAndCompatibility } from '/app/resources/deck_configuration/hooks'
import type { AttachedProtocolModuleMatch } from '/app/transformations/analysis'

const DECK_CONFIG_REFETCH_INTERVAL = 5000

interface ModuleTableProps {
  attachedProtocolModuleMatches: AttachedProtocolModuleMatch[]
  deckConfigCompatibility: CutoutConfigAndCompatibility[]
  deckDef: DeckDefinition
  runId: string
}

export function ModuleTable(props: ModuleTableProps): JSX.Element {
  const {
    attachedProtocolModuleMatches,
    deckDef,
    runId,
    deckConfigCompatibility,
  } = props

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
          // special case for waste chute and stacker combination fixture item
          if (
            module.moduleDef.moduleType === FLEX_STACKER_MODULE_TYPE &&
            module.slotName === 'D3'
          ) {
            const deckConfigCompatabilityD3 = deckConfigCompatibility?.find(
              configItem => configItem.cutoutId === 'cutoutD3'
            )
            if (
              deckConfigCompatabilityD3 != null &&
              WASTE_CHUTE_FLEX_STACKER_FIXTURES.includes(
                deckConfigCompatabilityD3?.compatibleCutoutFixtureIds[0]
              ) || WASTE_CHUTE_FLEX_STACKER_FIXTURES.includes(deckConfigCompatabilityD3?.cutoutFixtureId)
            ) {
              const comboFixtureId =
                deckConfigCompatabilityD3?.compatibleCutoutFixtureIds[0]
              const comboFixtureConflict = !deckConfigCompatabilityD3?.compatibleCutoutFixtureIds.includes(
                deckConfigCompatabilityD3.cutoutFixtureId
              )
              return (
                <ModuleTableItem
                  key={module.moduleId}
                  module={module}
                  calibrationStatus={calibrationStatus}
                  chainLiveCommands={chainLiveCommands}
                  comboFixtureId={comboFixtureId}
                  conflictedFixture={
                    comboFixtureConflict ? deckConfigCompatabilityD3 : null
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
