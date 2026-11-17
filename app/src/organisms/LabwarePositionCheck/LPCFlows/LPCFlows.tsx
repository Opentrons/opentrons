import { LPCWizardContainer } from '/app/organisms/LabwarePositionCheck/LPCWizardContainer'

import type { ReactNode } from 'react'
import type {
  DocumentationState,
  DocumentedAction,
} from '@opentrons/react-api-client'
import type {
  CompletedProtocolAnalysis,
  DeckConfiguration,
  LabwareDefinition,
} from '@opentrons/shared-data'
import type { useLPCAnalytics } from '/app/organisms/LabwarePositionCheck'
import type { LPCLabwareInfo } from '/app/redux/protocol-runs'

export interface LPCFlowsProps {
  onCloseClick: () => void
  isClosing: boolean
  runId: string
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

export function LPCFlows(props: LPCFlowsProps): ReactNode {
  return <LPCWizardContainer {...props} />
}
