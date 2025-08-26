import { AlignControlToModule, BaseDeck, Flex } from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  getSimplestDeckConfigForProtocol,
} from '@opentrons/shared-data'

import { getStandardDeckViewLayerBlockList } from '/app/local-resources/deck_configuration'
import { useModuleUSBPort } from '/app/local-resources/modules'
import { ModuleInfo } from '/app/molecules/ModuleInfo'

import type { ModuleOnDeck } from '@opentrons/components'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import type { AttachedProtocolModuleMatch } from '/app/transformations/analysis'

interface ModulesAndDeckMapViewProps {
  attachedProtocolModuleMatches: AttachedProtocolModuleMatch[]
  runId: string
  protocolAnalysis: CompletedProtocolAnalysis | null
}

export function ModulesAndDeckMapView({
  attachedProtocolModuleMatches,
  runId,
  protocolAnalysis,
}: ModulesAndDeckMapViewProps): JSX.Element | null {
  const { parseModuleUSBPort } = useModuleUSBPort()
  if (protocolAnalysis == null || protocolAnalysis.robotType == null) {
    return null
  }
  const deckConfig = getSimplestDeckConfigForProtocol(protocolAnalysis)
  const deckDef = getDeckDefFromRobotType(protocolAnalysis.robotType)

  const modulesOnDeck = attachedProtocolModuleMatches.map(
    (module): ModuleOnDeck => ({
      moduleModel: module.moduleDef.model,
      moduleLocation: { slotName: module.slotName },
      moduleChildren: (
        <AlignControlToModule
          deckId={deckDef.otId}
          slotId={module.slotName}
          moduleDefinition={module.moduleDef}
        >
          <ModuleInfo
            moduleModel={module.moduleDef.model}
            isAttached={module.attachedModuleMatch != null}
            physicalPort={parseModuleUSBPort(module.attachedModuleMatch)}
            runId={runId}
          />
        </AlignControlToModule>
      ),
    })
  )

  return (
    <Flex height="27.75rem">
      <BaseDeck
        deckConfig={deckConfig}
        deckLayerBlocklist={getStandardDeckViewLayerBlockList(FLEX_ROBOT_TYPE)}
        robotType={FLEX_ROBOT_TYPE}
        labwareOnDeck={[]}
        modulesOnDeck={modulesOnDeck}
      />
    </Flex>
  )
}
