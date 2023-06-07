import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
} from '@opentrons/components'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { MediumButton } from '../../atoms/buttons'
import { ODDBackButton } from '../../molecules/ODDBackButton'
import { useMaintenanceRunTakeover } from '../TakeoverModal'
import { useLaunchLPC } from '../LabwarePositionCheck/useLaunchLPC'

import type { SetupScreens } from '../../pages/OnDeviceDisplay/ProtocolSetup'

export interface ProtocolSetupLabwarePositionCheckProps {
  runId: string
  setSetupScreen: React.Dispatch<React.SetStateAction<SetupScreens>>
}

export function ProtocolSetupLabwarePositionCheck({
  runId,
  setSetupScreen,
}: ProtocolSetupLabwarePositionCheckProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  const { launchLPC, LPCWizard } = useLaunchLPC(runId)
  const { setODDMaintenanceFlowInProgress } = useMaintenanceRunTakeover()

  const handleLaunchLPCClick = (): void => {
    setODDMaintenanceFlowInProgress()
    launchLPC()
  }

  return LPCWizard != null ? (
    LPCWizard
  ) : (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      width="100%"
      gridGap={SPACING.spacing8}
    >
      <ODDBackButton
        label={t('labware_position_check')}
        onClick={() => setSetupScreen('prepare to run')}
      />
      <Flex
        height="20rem"
        width="100%"
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
      >
        <MediumButton
          onClick={handleLaunchLPCClick}
          buttonType="secondary"
          buttonText="Start Labware Position Check"
        />
      </Flex>
    </Flex>
  )
}
