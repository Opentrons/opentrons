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

export function ConfirmDeleteStepModal(props: Props) {
  const { close, ...continueModalProps } = props
  return (
    <Portal>
      <ContinueModal className={modalStyles.modal} {...continueModalProps}>
        {close
          ? i18n.t('modal.close_step.body')
          : i18n.t('modal.delete_step.body')}
      </ContinueModal>
    </Portal>
  )
}
