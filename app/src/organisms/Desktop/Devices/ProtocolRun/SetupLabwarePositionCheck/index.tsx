import { FlexSetupLPC } from './FlexSetupLPC'

import type { ReactNode } from 'react'
import type { RobotType } from '@opentrons/shared-data'
import type { UseLPCFlowsResult } from '/app/organisms/LabwarePositionCheck'

export interface SetupLabwarePositionCheckProps {
  offsetsConfirmed: boolean
  setOffsetsConfirmed: (confirmed: boolean) => void
  robotName: string
  robotType: RobotType
  runId: string
  lpcUtils: UseLPCFlowsResult
  hasMissingModulesForFlex: boolean
  hasMissingCalForFlex: boolean
}

export function SetupLabwarePositionCheck(
  props: SetupLabwarePositionCheckProps
): ReactNode {
  return <FlexSetupLPC {...props} />
}
