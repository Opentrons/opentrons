import * as React from 'react'
import map from 'lodash/map'

import { BaseDeck } from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'
import {
  parseInitialLoadedLabwareByAdapter,
  parseLabwareInfoByLiquidId,
} from '@opentrons/api-client'

import { getStandardDeckViewLayerBlockList } from './utils/getStandardDeckViewLayerBlockList'
import { getSimplestDeckConfigForProtocolCommands } from '../../resources/deck_configuration/utils'
import { getLabwareRenderInfo } from '../../organisms/Devices/ProtocolRun/utils/getLabwareRenderInfo'
import { getProtocolModulesInfo } from '../../organisms/Devices/ProtocolRun/utils/getProtocolModulesInfo'
import { useAttachedModules } from '../../organisms/Devices/hooks'
import { getAttachedProtocolModuleMatches } from '../../organisms/ProtocolSetupModulesAndDeck/utils'
import { getWellFillFromLabwareId } from '../../organisms/Devices/ProtocolRun/SetupLiquids/utils'

import type { StyleProps } from '@opentrons/components'
import type {
  CompletedProtocolAnalysis,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'

interface DeckThumbnailProps extends StyleProps {
  protocolAnalysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput | null
  showSlotLabels?: boolean
}

export function DeckThumbnail(props: DeckThumbnailProps): JSX.Element | null {
  const { protocolAnalysis, showSlotLabels = false, ...styleProps } = props
  const attachedModules = useAttachedModules()

  if (protocolAnalysis == null || protocolAnalysis.errors.length) return null
  const robotType = protocolAnalysis.robotType ?? FLEX_ROBOT_TYPE
  const deckDef = getDeckDefFromRobotType(robotType)
  const initialLoadedLabwareByAdapter = parseInitialLoadedLabwareByAdapter(
    protocolAnalysis.commands
  )

  const deckConfig = getSimplestDeckConfigForProtocolCommands(
    protocolAnalysis.commands
  )
  const liquids = protocolAnalysis.liquids
  const labwareRenderInfo = getLabwareRenderInfo(protocolAnalysis, deckDef)
  const protocolModulesInfo = getProtocolModulesInfo(protocolAnalysis, deckDef)

  const attachedProtocolModuleMatches = getAttachedProtocolModuleMatches(
    attachedModules,
    protocolModulesInfo
  )
  const labwareByLiquidId = parseLabwareInfoByLiquidId(
    protocolAnalysis.commands
  )

  const moduleLocations = attachedProtocolModuleMatches.map(module => {
    const labwareInAdapterInMod =
      module.nestedLabwareId != null
        ? initialLoadedLabwareByAdapter[module.nestedLabwareId]
        : null
    //  only rendering the labware on top most layer so
    //  either the adapter or the labware are rendered but not both
    const topLabwareDefinition =
      labwareInAdapterInMod?.result?.definition ?? module.nestedLabwareDef
    const nestedLabwareWellFill = getWellFillFromLabwareId(
      module.nestedLabwareId ?? '',
      liquids,
      labwareByLiquidId
    )
    // const labwareHasLiquid = !isEmpty(wellFill)
    return {
      moduleModel: module.moduleDef.model,
      moduleLocation: { slotName: module.slotName },
      nestedLabwareWellFill,
      innerProps:
        module.moduleDef.model === THERMOCYCLER_MODULE_V1
          ? { lidMotorState: 'open' }
          : {},
      nestedLabwareDef: topLabwareDefinition,
    }
  })

  const labwareLocations = map(
    labwareRenderInfo,
    ({ labwareDef, slotName }, labwareId) => {
      const labwareInAdapter = initialLoadedLabwareByAdapter[labwareId]
      //  only rendering the labware on top most layer so
      //  either the adapter or the labware are rendered but not both
      const topLabwareDefinition =
        labwareInAdapter?.result?.definition ?? labwareDef
      const topLabwareId = labwareInAdapter?.result?.labwareId ?? labwareId

      const wellFill = getWellFillFromLabwareId(
        topLabwareId ?? '',
        liquids,
        labwareByLiquidId
      )
      return {
        labwareLocation: { slotName },
        definition: topLabwareDefinition,
        wellFill: wellFill,
      }
    }
  )

  return (
    <BaseDeck
      deckConfig={deckConfig}
      deckLayerBlocklist={getStandardDeckViewLayerBlockList(robotType)}
      robotType={robotType}
      labwareLocations={labwareLocations}
      moduleLocations={moduleLocations}
      showSlotLabels={showSlotLabels}
      {...styleProps}
    ></BaseDeck>
  )
}
