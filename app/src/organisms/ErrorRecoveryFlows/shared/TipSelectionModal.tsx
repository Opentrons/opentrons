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
  const { toggleModal } = props
  const { t } = useTranslation('error_recovery')

  const modalHeader: ModalHeaderBaseProps = {
    title: t('change_tip_pickup_location'),
    hasExitIcon: true,
  }

  if (props.isOnDevice) {
    return createPortal(
      <Modal header={modalHeader} onOutsideClick={toggleModal} zIndex={15}>
        <TipSelection {...props} />
      </Modal>,
      getTopPortalEl()
    )
  } else {
    return null
  }
}
