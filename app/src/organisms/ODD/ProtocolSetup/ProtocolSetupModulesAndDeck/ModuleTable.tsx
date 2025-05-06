import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  BORDERS,
  Chip,
  COLORS,
  DeckInfoLabel,
  Flex,
  InfoScreen,
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_COLUMN,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  ABSORBANCE_READER_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  getCutoutFixturesForModuleModel,
  getCutoutIdsFromModuleSlotName,
  getModuleDisplayName,
  getModuleType,
  MAGNETIC_BLOCK_TYPE,
  TC_MODULE_LOCATION_OT3,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import { SmallButton } from '/app/atoms/buttons'
import { OddModal } from '/app/molecules/OddModal'
import {
  getFlexStackerPrepCommands,
  getModulePrepCommands,
} from '/app/local-resources/modules'
import { LocationConflictModal } from '/app/organisms/LocationConflictModal'
import { ModuleWizardFlows } from '/app/organisms/ModuleWizardFlows'
import { useToaster } from '/app/organisms/ToasterOven'
import { getLocalRobot } from '/app/redux/discovery'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'
import {
  useChainLiveCommands,
  useRunCalibrationStatus,
} from '/app/resources/runs'
import { getModuleTooHot } from '/app/transformations/modules'

import type { Dispatch, SetStateAction } from 'react'
import type { AttachedModule, CommandData } from '@opentrons/api-client'
import type { CutoutConfig, DeckDefinition } from '@opentrons/shared-data'
import type { ModulePrepCommandsType } from '/app/local-resources/modules'
import type { ProtocolCalibrationStatus } from '/app/resources/runs'
import type { AttachedProtocolModuleMatch } from '/app/transformations/analysis'
import { useIsDoorOpen } from '/app/organisms/DoorOpenControl/useIsDoorOpen'
import { ModuleTableItem } from './ModuleTableItem'

const DECK_CONFIG_REFETCH_INTERVAL = 5000

interface ModuleTableProps {
  attachedProtocolModuleMatches: AttachedProtocolModuleMatch[]
  deckDef: DeckDefinition
  runId: string
}

export function ModuleTable(props: ModuleTableProps): JSX.Element {
  const { attachedProtocolModuleMatches, deckDef, runId } = props

  const [
    prepCommandErrorMessage,
    setPrepCommandErrorMessage,
  ] = useState<string>('')

  const { data: deckConfig } = useNotifyDeckConfigurationQuery({
    refetchInterval: DECK_CONFIG_REFETCH_INTERVAL,
  })
  const localRobot = useSelector(getLocalRobot)
  const robotName: string = localRobot?.name ?? ''
  const calibrationStatus = useRunCalibrationStatus(robotName, runId)
  const { chainLiveCommands, isCommandMutationLoading } = useChainLiveCommands()

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
              isLoading={isCommandMutationLoading}
              prepCommandErrorMessage={prepCommandErrorMessage}
              setPrepCommandErrorMessage={setPrepCommandErrorMessage}
              conflictedFixture={conflictedFixture}
              deckDef={deckDef}
              robotName={robotName}
            />
          )
        })}
    </>
  )
}
