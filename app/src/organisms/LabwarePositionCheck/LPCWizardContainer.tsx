import { LPCWizardFlex } from './LPCWizardFlex'

import type { ReactNode } from 'react'
import type { LegacySupportLPCFlowsProps } from '/app/organisms/LabwarePositionCheck/LPCFlows'

export function LPCWizardContainer(
  props: LegacySupportLPCFlowsProps
): ReactNode {
  return <LPCWizardFlex {...props} />
}
