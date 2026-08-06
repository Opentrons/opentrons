import { useTranslation } from 'react-i18next'

import { TouchFloatingActionButton } from '/app/atoms/buttons'
import { LPCFlows } from '/app/organisms/LabwarePositionCheck'
import { useToaster } from '/app/organisms/ToasterOven'

import styles from './protocolsetupoffsets.module.css'
import { SetupOffsetsHeader } from './SetupOffsetsHeader'
import { SetupOffsetsTable } from './SetupOffsetsTable'

import type { Dispatch, SetStateAction } from 'react'
import type { Run } from '@opentrons/api-client'
import type { UseLPCFlowsResult } from '/app/organisms/LabwarePositionCheck'
import type { SetupScreens } from '../types'

export interface ProtocolSetupOffsetsProps {
  lpcLaunchProps: UseLPCFlowsResult
  runId: string
  runRecord: Run | undefined
  setSetupScreen: Dispatch<SetStateAction<SetupScreens>>
  lpcDisabledReason: string | null
  isConfirmed: boolean
}

export function ProtocolSetupOffsets(
  props: ProtocolSetupOffsetsProps
): JSX.Element {
  const { lpcDisabledReason, lpcLaunchProps } = props
  const { showLPC, lpcProps, launchLPC } = lpcLaunchProps
  const { t } = useTranslation('protocol_setup')
  const { makeSnackbar } = useToaster()

  const onLPCLaunchClick = (): void => {
    if (lpcDisabledReason != null) {
      makeSnackbar(lpcDisabledReason)
    } else {
      void launchLPC()
    }
  }

  return (
    <>
      {showLPC ? (
        <LPCFlows {...lpcProps} />
      ) : (
        <div className={styles.setup_offset_container}>
          <SetupOffsetsHeader {...props} />
          <SetupOffsetsTable {...props} />
          <TouchFloatingActionButton
            buttonText={t('labware_position_check')}
            iconName="reticle"
            onClick={onLPCLaunchClick}
            aria-label={t('proceed_labware_position_check')}
          />
        </div>
      )}
    </>
  )
}
