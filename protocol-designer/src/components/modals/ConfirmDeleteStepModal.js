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

const CANCEL = 'Cancel'
const DELETE_STEP = 'Delete Step'

export function ConfirmDeleteStepModal(props: Props): React.Node {
  const { close, ...continueModalProps } = props

  const buttons = close
    ? []
    : [
        { title: CANCEL, children: CANCEL, onClick: props.onCancelClick },
        {
          title: DELETE_STEP,
          children: DELETE_STEP,
          onClick: props.onContinueClick,
        },
      ]
  return (
    <Portal>
      <ContinueModal
        className={modalStyles.modal}
        {...continueModalProps}
        buttons={buttons}
      >
        {close
          ? i18n.t('modal.close_step.body')
          : i18n.t('modal.delete_step.body')}
      </ContinueModal>
    </Portal>
  )
}
