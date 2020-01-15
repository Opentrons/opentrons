// @flow
import React from 'react'
import { connect } from 'react-redux'
import cx from 'classnames'
import { OutlineButton, PrimaryButton } from '@opentrons/components'

import { actions as steplistActions } from '../../../steplist'
import { actions as stepFormActions } from '../../../step-forms'

import { getCurrentFormCanBeSaved } from './selector'

import type { BaseState } from '../../../types'

import styles from './styles.css'
const { button_row, form_button, form_wrapper } = styles

const { cancelStepForm } = steplistActions
const { saveStepForm } = stepFormActions

type OwnProps = {|
  onClickMoreOptions: (event: SyntheticEvent<>) => void,
  onDelete?: (event: SyntheticEvent<>) => void,
|}

type StateProps = {| canSave?: ?boolean |}

type DispatchProps = {|
  onCancel: typeof cancelStepForm,
  onSave: typeof saveStepForm,
|}

type Props = {| ...OwnProps, ...StateProps, ...DispatchProps |}

const mapStateToProps = (state: BaseState): StateProps => ({
  canSave: getCurrentFormCanBeSaved(state),
})

const mapDispatchToProps: DispatchProps = {
  onCancel: cancelStepForm,
  onSave: saveStepForm,
}

const ButtonRowComponent = ({
  canSave,
  onDelete,
  onSave,
  onCancel,
  onClickMoreOptions,
}: Props) => (
  <div className={cx(button_row, form_wrapper)}>
    <div>
      <OutlineButton className={form_button} onClick={onDelete}>
        Delete
      </OutlineButton>
      <OutlineButton className={form_button} onClick={onClickMoreOptions}>
        Notes
      </OutlineButton>
    </div>
    <div>
      <PrimaryButton className={form_button} onClick={onCancel}>
        Close
      </PrimaryButton>
      <PrimaryButton
        className={form_button}
        disabled={!canSave}
        onClick={canSave ? onSave : undefined}
      >
        Saved
      </PrimaryButton>
    </div>
  </div>
)

export const ButtonRow = connect<
  Props,
  OwnProps,
  StateProps,
  DispatchProps,
  _,
  _
>(
  mapStateToProps,
  mapDispatchToProps
)(ButtonRowComponent)
