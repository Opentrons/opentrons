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

import { getStandardDeckViewLayerBlockList, getSimplestDeckConfigForProtocolCommands  } from './utils'
import { getProtocolModulesInfo } from '../../organisms/Devices/ProtocolRun/utils/getProtocolModulesInfo'

import { useAttachedModules } from '../../organisms/Devices/hooks'
import { getAttachedProtocolModuleMatches } from '../../organisms/ProtocolSetupModulesAndDeck/utils'
import { getWellFillFromLabwareId } from '../../organisms/Devices/ProtocolRun/SetupLiquids/utils'

import type { StyleProps } from '@opentrons/components'
import type {
  CompletedProtocolAnalysis,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'
import { getLabwareOnDeck } from './utils/getLabwareOnDeck'

interface ProtocolDeckProps extends StyleProps {
  protocolAnalysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput | null
  /** extra props to pass through to BaseDeck component */
  baseDeckProps?: React.ComponentProps<typeof BaseDeck>
}

export function ProtocolDeck(props: ProtocolDeckProps): JSX.Element | null {
  const { protocolAnalysis, baseDeckProps} = props
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

  return (
    <BaseDeck
      deckConfig={deckConfig}
      deckLayerBlocklist={getStandardDeckViewLayerBlockList(robotType)}
      robotType={robotType}
      labwareLocations={getLabwareOnDeck(protocolAnalysis)}
      moduleLocations={moduleLocations}
      {...baseDeckProps}
    />
  )
}
