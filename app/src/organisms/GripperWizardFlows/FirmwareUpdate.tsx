import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  useInstrumentsQuery,
  useSubsystemUpdateQuery,
  useUpdateSubsystemMutation,
} from '@opentrons/react-api-client'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import type { GripperWizardStepProps } from './types'
import { BadGripper } from '@opentrons/api-client'

interface FirmwareUpdateProps extends GripperWizardStepProps {
  proceed: () => void
}

export const FirmwareUpdate = (props: FirmwareUpdateProps): JSX.Element => {
  const { proceed } = props
  const { t } = useTranslation('pipette_wizard_flows')
  const [updateId, setUpdateId] = React.useState('')
  const {
    data: attachedInstruments,
    refetch: refetchInstruments,
  } = useInstrumentsQuery()
  const { updateSubsystem } = useUpdateSubsystemMutation({
    onSuccess: data => {
      setUpdateId(data.data.id)
    },
  })
  console.log(updateId)
  const updateNeeded =
    attachedInstruments?.data?.some(
      (i): i is BadGripper => !i.ok && i.subsystem === 'gripper'
    ) ?? false
  React.useEffect(() => {
    if (!updateNeeded) {
      proceed()
    } else {
      updateSubsystem('gripper')
    }
  }, [])
  const { data: updateData } = useSubsystemUpdateQuery(updateId)
  const status = updateData?.data.updateStatus
  React.useEffect(() => {
    if (status === 'done') {
      refetchInstruments()
        .then(() => {
          proceed()
        })
        .catch(() => {
          proceed()
        })
    }
  }, [status, proceed, refetchInstruments])
  return <InProgressModal description={t('firmware_updating')} />
}
