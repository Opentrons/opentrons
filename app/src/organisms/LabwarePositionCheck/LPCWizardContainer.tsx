import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import { LegacyLabwarePositionCheck } from '/app/organisms/LegacyLabwarePositionCheck'

import { LPCWizardFlex } from './LPCWizardFlex'

import type { ReactNode } from 'react'
import type { LegacySupportLPCFlowsProps } from '/app/organisms/LabwarePositionCheck/LPCFlows'

export function LPCWizardContainer(
  props: LegacySupportLPCFlowsProps
): ReactNode {
  switch (props.robotType) {
    case FLEX_ROBOT_TYPE:
      return <LPCWizardFlex {...props} />
    case OT2_ROBOT_TYPE:
      return (
        <LegacyLabwarePositionCheck
          {...props}
          existingOffsets={props.ot2Offsets}
          mostRecentAnalysis={props.analysis}
          isDeletingMaintenanceRun={props.isClosing}
        />
      )
    default: {
      console.error('Unhandled robot type in LPC.')
      return <></>
    }
  }
}
