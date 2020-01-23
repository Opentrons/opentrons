// @flow
import * as React from 'react'
import { ContinueModal } from '@opentrons/components'
import i18n from '../../localization'
import { Portal } from '../portals/MainPageModalPortal'
import modalStyles from './modal.css'

type Props = $Diff<React.ElementProps<typeof ContinueModal>, { children: * }>

export function ConfirmDeleteStepModal(props: Props) {
  return (
    <Portal>
      <ContinueModal className={modalStyles.modal} {...props}>
        {i18n.t('modal.delete_step.body')}
      </ContinueModal>
    </Portal>
  )
}
