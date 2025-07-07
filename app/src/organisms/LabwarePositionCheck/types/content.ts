import type { UseLPCCommandsResult } from '/app/organisms/LabwarePositionCheck/hooks'
import type { UseLPCHeaderCommandsResult } from '/app/organisms/LabwarePositionCheck/hooks/useLPCCommands/useLPCHeaderCommands'
import type { LPCWizardFlexProps } from '/app/organisms/LabwarePositionCheck/LPCWizardFlex'
import type { LPCStep } from '/app/redux/protocol-runs'

export type LPCWizardContentProps = Pick<
  LPCWizardFlexProps,
  'runId' | 'analytics'
> & {
  proceedStep: (toStep?: LPCStep) => void
  goBackLastStep: () => void
  commandUtils: UseLPCCommandsResult & {
    headerCommands: UseLPCHeaderCommandsResult
  }
}
