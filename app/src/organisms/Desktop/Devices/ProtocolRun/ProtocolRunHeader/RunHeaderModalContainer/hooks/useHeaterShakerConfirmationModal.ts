import { useSelector } from 'react-redux'

import { useConditionalConfirm } from '@opentrons/components'

import { getIsHeaterShakerAttached } from '/app/redux/config'

import type { UseConditionalConfirmResult } from '@opentrons/components'
import type { ConfirmAttachmentModalProps } from '/app/organisms/ModuleCard/ConfirmAttachmentModal'

export type UseHeaterShakerConfirmationModalResult =
  | {
      showModal: true
      modalProps: ConfirmAttachmentModalProps
      conditionalConfirmUtils: UseConditionalConfirmResult<[]>
    }
  | {
      showModal: false
      modalProps: null
      conditionalConfirmUtils: UseConditionalConfirmResult<[]>
    }

export function useHeaterShakerConfirmationModal(
  handleProceedToRunClick: () => void
): UseHeaterShakerConfirmationModalResult {
  const configBypassHeaterShakerAttachmentConfirmation = useSelector(
    getIsHeaterShakerAttached
  )
  const conditionalConfirmUtils = useConditionalConfirm(
    handleProceedToRunClick,
    !configBypassHeaterShakerAttachmentConfirmation
  )

  const modalProps: ConfirmAttachmentModalProps = {
    onCloseClick: conditionalConfirmUtils.cancel,
    isProceedToRunModal: true,
    onConfirmClick: conditionalConfirmUtils.confirm,
  }

  return conditionalConfirmUtils.showConfirmation
    ? {
        showModal: true,
        modalProps,
        conditionalConfirmUtils,
      }
    : {
        showModal: false,
        modalProps: null,
        conditionalConfirmUtils,
      }
}
