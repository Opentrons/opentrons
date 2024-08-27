import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'

import { Modal } from '../../../molecules/Modal'
import { getTopPortalEl } from '../../../App/portal'
import { TipSelection } from './TipSelection'

import type { ModalHeaderBaseProps } from '../../../molecules/Modal/types'
import type { TipSelectionProps } from './TipSelection'

type TipSelectionModalProps = TipSelectionProps & {
  toggleModal: () => void
}

export function TipSelectionModal(
  props: TipSelectionModalProps
): JSX.Element | null {
  const { isOnDevice, toggleModal, failedLabwareUtils } = props
  const { areTipsSelected } = failedLabwareUtils
  const { t } = useTranslation('error_recovery')

  // If users end up in a state in which they deselect all wells, don't let them escape this modal.
  const modalHeader: ModalHeaderBaseProps = {
    title: t('change_tip_pickup_location'),
    hasExitIcon: areTipsSelected,
  }

  if (isOnDevice) {
    return createPortal(
      <Modal
        header={modalHeader}
        onOutsideClick={areTipsSelected ? toggleModal : undefined}
        zIndex={15}
      >
        <TipSelection {...props} />
      </Modal>,
      getTopPortalEl()
    )
  } else {
    return null
  }
}
