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
  const {
    data: attachedInstruments,
    refetch: refetchInstruments,
  } = useInstrumentsQuery()
  const { updateSubsystem } = useUpdateSubsystemMutation()

  const subsystem = mount === LEFT ? 'pipette_left' : 'pipette_right'

  const updateNeeded =
    attachedInstruments?.data?.some(
      (i): i is BadPipette => 'subsystem' in i && i.subsystem === subsystem
    ) ?? false
  console.log('attached instruments', attachedInstruments?.data)
  if (!updateNeeded) {
    console.log('no update needed')
    proceed()
  } else {
    updateSubsystem(subsystem)
    console.log('updating subsystem')
  }
  const { data: updateData } = useSubsystemUpdateQuery(subsystem)
  const status = updateData?.status
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
