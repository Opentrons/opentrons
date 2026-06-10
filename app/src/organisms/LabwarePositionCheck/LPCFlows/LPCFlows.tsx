import { LPCWizardContainer } from '/app/organisms/LabwarePositionCheck/LPCWizardContainer'

import type { LabwareOffset } from '@opentrons/api-client'
import type {
  DocumentationState,
  DocumentedAction,
} from '@opentrons/react-api-client'
import type {
  CompletedProtocolAnalysis,
  DeckConfiguration,
  LabwareDefinition,
  RobotType,
} from '@opentrons/shared-data'
import type { useLPCAnalytics } from '/app/organisms/LabwarePositionCheck'
import type { LPCLabwareInfo } from '/app/redux/protocol-runs'

// Inject the props specific to the legacy LPC flows, too.
export interface LegacySupportLPCFlowsProps extends LPCFlowsProps {
  ot2Offsets: LabwareOffset[]
}

export interface LPCFlowsProps {
  onCloseClick: () => void
  isClosing: boolean
  runId: string
  robotType: RobotType
  deckConfig: DeckConfiguration
  labwareDefs: LabwareDefinition[]
  labwareInfo: LPCLabwareInfo
  analysis: CompletedProtocolAnalysis
  protocolName: string
  maintenanceRunId: string
  analytics: ReturnType<typeof useLPCAnalytics>
  commandDocState: DocumentationState
  actionsToDocument: DocumentedAction[]
  addActionToDocument: (action: DocumentedAction) => void
}

export function LPCFlows(props: LegacySupportLPCFlowsProps): JSX.Element {
  return <LPCWizardContainer {...props} />
}
