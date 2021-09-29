import { Modal } from '@opentrons/components'
import * as React from 'react'
import { useTranslation } from 'react-i18next'

interface LabwarePositionCheckStepDetailModalProps {
    onCloseClick: () => unknown
}
export const LabwarePositionCheckStepDetailModal = (
    props: LabwarePositionCheckStepDetailModalProps
  ): JSX.Element => { 
    const { t } = useTranslation(['labware_position_check'])  
    return (
      <Modal>

      </Modal>
  )
  }