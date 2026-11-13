import type { UseLPCCommandsResult } from '/app/organisms/LabwarePositionCheck/hooks'
import type { UseLPCHeaderCommandsResult } from '/app/organisms/LabwarePositionCheck/hooks/useLPCCommands/useLPCHeaderCommands'
import type { LPCFlowsProps } from '/app/organisms/LabwarePositionCheck/LPCFlows'
import type { LPCStep } from '/app/redux/protocol-runs'

export type LPCWizardContentProps = Pick<
  LPCFlowsProps,
  'runId' | 'analytics'
> & {
  proceedStep: (toStep?: LPCStep) => void
  goBackLastStep: () => void
  commandUtils: UseLPCCommandsResult & {
    headerCommands: UseLPCHeaderCommandsResult
  }
}
