import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'

import { OddModal } from '../../../molecules/OddModal'
import { getTopPortalEl } from '../../../App/portal'
import { TipSelection } from './TipSelection'

import type { OddModalHeaderBaseProps } from '../../../molecules/OddModal/types'
import type { TipSelectionProps } from './TipSelection'

type TipSelectionModalProps = TipSelectionProps & {
  toggleModal: () => void
}

export function TipSelectionModal(
  props: TipSelectionModalProps
): JSX.Element | null {
  const { toggleModal } = props
  const { t } = useTranslation('error_recovery')

  const modalHeader: OddModalHeaderBaseProps = {
    title: t('change_tip_pickup_location'),
    hasExitIcon: true,
  }

  if (props.isOnDevice) {
    return createPortal(
      <OddModal header={modalHeader} onOutsideClick={toggleModal} zIndex={15}>
        <TipSelection {...props} />
      </OddModal>,
      getTopPortalEl()
    )
  } else {
    return null
  }
}
