import * as React from 'react'
import { createPortal } from 'react-dom'
import { css } from 'styled-components'

import { Flex, RESPONSIVENESS } from '@opentrons/components'

import { InterventionModal } from '../../../molecules/InterventionModal'
import { getModalPortalEl } from '../../../App/portal'

import type { ModalType } from '../../../molecules/InterventionModal'

export type RecoveryInterventionModalProps = Omit<
  React.ComponentProps<typeof InterventionModal>,
  'type'
> & {
  modalType: 'odd' | 'desktop-small' | 'desktop-large'
}

// A wrapper around InterventionModal with Error-Recovery specific props and styling.
export function RecoveryInterventionModal({
  children,
  modalType,
  ...rest
}: RecoveryInterventionModalProps): JSX.Element {
  const height = getHeight(modalType)
  const restProps = {
    ...rest,
    type: 'error' as ModalType,
  }

  return createPortal(
    <InterventionModal {...restProps}>
      <Flex height={height}>{children}</Flex>
    </InterventionModal>,
    getModalPortalEl()
  )
}

// TODO DO CSS.
function getHeight(
  modalType: RecoveryInterventionModalProps['modalType']
): string {
  if (modalType === 'odd') {
    return '100%'
  } else if (modalType === 'desktop-small') {
    return '25.25rem'
  } else {
    return '30rem'
  }
}
