// @flow
// BlockingHint is an "are you sure" modal that can be dismissed.
// Instances of BlockingHint need to be individually placed by whatever component
// is controlling the flow that this modal will block, via useBlockingHint.
import React, { useState, useCallback, type Node } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { actions, selectors } from '../../tutorial'
import { ContinueModal, CheckboxField } from '@opentrons/components'
import { Portal } from '../portals/MainPageModalPortal'
import { i18n } from '../../localization'
import styles from './hints.css'
import type { HintKey } from '../../tutorial'

type Props = {|
  hintKey: HintKey,
  handleCancel: () => mixed,
  handleContinue: () => mixed,
|}

// This component handles the checkbox and dispatching `removeHint` action on continue/cancel
const BlockingHint = (props: Props) => {
  const { hintKey, handleCancel, handleContinue } = props
  const dispatch = useDispatch()

  const [rememberDismissal, setRememberDismissal] = useState<boolean>(false)

  const toggleRememberDismissal = useCallback(() => {
    setRememberDismissal(prevDismissal => !prevDismissal)
  }, [])

  const onCancelClick = () => {
    dispatch(actions.removeHint(hintKey, rememberDismissal))
    handleCancel()
  }

  const onContinueClick = () => {
    dispatch(actions.removeHint(hintKey, rememberDismissal))
    handleContinue()
  }

  return (
    <Portal>
      <ContinueModal
        alertOverlay
        heading={i18n.t(`alert.hint.${hintKey}.title`)}
        onCancelClick={onCancelClick}
        onContinueClick={onContinueClick}
      >
        {i18n.t(`alert.hint.${hintKey}.body`)}
        <div>
          <CheckboxField
            className={styles.dont_show_again}
            label={i18n.t('alert.hint.dont_show_again')}
            onChange={toggleRememberDismissal}
            value={rememberDismissal}
          />
        </div>
      </ContinueModal>
    </Portal>
  )
}

export const useBlockingHint = (args: {|
  /** `enabled` should be a condition that the parent uses to toggle whether the hint should be active or not.
   * If the hint is enabled but has been dismissed, it will automatically call `handleContinue` when enabled.
   * useBlockingHint expects the parent to disable the hint on cancel/continue */
  enabled: boolean,
  hintKey: HintKey,
  handleCancel: () => mixed,
  handleContinue: () => mixed,
|}): ?Node => {
  const { enabled, hintKey, handleCancel, handleContinue } = args
  const isDismissed = useSelector(selectors.getDismissedHints).includes(hintKey)

  if (isDismissed) {
    if (enabled) {
      handleContinue()
    }
    return null
  }

  if (!enabled) {
    return null
  }

  return (
    <BlockingHint
      hintKey={hintKey}
      handleCancel={handleCancel}
      handleContinue={handleContinue}
    />
  )
}
