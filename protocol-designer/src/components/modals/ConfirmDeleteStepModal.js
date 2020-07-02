// @flow
import * as React from 'react'
import { ContinueModal } from '@opentrons/components'
import { i18n } from '../../localization'
import { Portal } from '../portals/MainPageModalPortal'
import modalStyles from './modal.css'

type Props = {|
  ...$Diff<React.ElementProps<typeof ContinueModal>, { children: * }>,
  close?: boolean,
|}

export function ConfirmDeleteStepModal(props: Props): React.Node {
  const { close, ...continueModalProps } = props
  return (
    <Portal>
      <ContinueModal
        className={modalStyles.modal}
        {...(close ? { heading: 'Unsaved Step form' } : null)}
        {...continueModalProps}
      >
        <p>
          {i18n.t(close ? 'modal.close_step.body' : 'modal.delete_step.body')}
        </p>
      </ContinueModal>
    </Portal>
  )
}
