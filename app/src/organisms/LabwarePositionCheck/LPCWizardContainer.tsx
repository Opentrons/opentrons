import { LPCWizardFlex } from './LPCWizardFlex'

import type { ReactNode } from 'react'
import type { LPCFlowsProps } from '/app/organisms/LabwarePositionCheck/LPCFlows'

export function LPCWizardContainer(
  props: LPCFlowsProps
): ReactNode {
  return <LPCWizardFlex {...props} />
}
