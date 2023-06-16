import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  useInstrumentsQuery,
  useSubsystemUpdateQuery,
  useUpdateSubsystemMutation,
} from '@opentrons/react-api-client'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import type { PipetteWizardStepProps } from './types'
import { BadPipette } from '@opentrons/api-client'
import { LEFT } from '@opentrons/shared-data'

interface FirmwareUpdateProps extends PipetteWizardStepProps {
  proceed: () => void
}

export const FirmwareUpdate = (props: FirmwareUpdateProps): JSX.Element => {
  const { proceed, mount } = props
  const { t } = useTranslation('pipette_wizard_flows')
  const [updateId, setUpdateId] = React.useState<string>('')
  const {
    data: attachedInstruments,
    refetch: refetchInstruments,
  } = useInstrumentsQuery()
  const { updateSubsystem } = useUpdateSubsystemMutation({
    onSuccess: data => {
      console.log('success')
      setUpdateId(data.data.id)
      console.log('data id', data.data.id)
    },
  })

  const subsystem = mount === LEFT ? 'pipette_left' : 'pipette_right'

  const updateNeeded =
    attachedInstruments?.data?.some(
      (i): i is BadPipette => 'subsystem' in i && i.subsystem === subsystem
    ) ?? false
  React.useEffect(() => {
    if (!updateNeeded) {
      console.log('no update needed')
      proceed()
    } else {
      updateSubsystem(subsystem)
      console.log('updating subsystem')
    }
  }, [])
  const { data: updateData } = useSubsystemUpdateQuery(updateId)
  console.log('update data', updateData)
  const status = updateData?.data.updateStatus
  console.log('status', status)
  React.useEffect(() => {
    if (status === 'done') {
      refetchInstruments()
        .then(() => {
          console.log('proceed')
          proceed?.()
        })
        .catch(() => {
          proceed()
        })
    }
  }, [status, proceed, refetchInstruments])
  return <InProgressModal description={t('firmware_updating')} />
}
