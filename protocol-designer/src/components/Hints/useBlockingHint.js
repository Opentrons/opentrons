// @flow
// BlockingHint is an "are you sure" modal that can be dismissed.
// Instances of BlockingHint need to be individually placed by whatever component
// is controlling the flow that this modal will block, via useBlockingHint.
import React, { useState, useCallback, type Node } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { actions, selectors } from '../../tutorial'
import { ContinueModal, CheckboxField } from '@opentrons/components'
import { Portal } from '../portals/MainPageModalPortal'
import i18n from '../../localization'
import styles from './hints.css'
import type { HintKey } from '../../tutorial'

type Props = {|
  hintKey: HintKey,
  handleCancel: () => mixed,
  handleContinue: () => mixed,
|}

const BlockingHint = (props: Props) => {
  const { hintKey, handleCancel, handleContinue } = props
  const dispatch = useDispatch()

  const [rememberDismissal, setRememberDismissal] = useState<boolean>(false)

  const toggleRememberDismissal = useCallback(() => {
    setRememberDismissal(prevDismissal => !prevDismissal)
  }, [])

  const onCancelClick = useCallback(() => {
    dispatch(actions.removeHint(hintKey, rememberDismissal))
    handleCancel()
  }, [rememberDismissal, handleCancel, dispatch, hintKey])

  const onContinueClick = useCallback(() => {
    dispatch(actions.removeHint(hintKey, rememberDismissal))
    handleContinue()
  }, [rememberDismissal, handleContinue, dispatch, hintKey])

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
  /** Do nothing, return `null`. Useful when a hint is not relevant under certain conditions */
  disable: boolean,
  /** Block BlockingHints from calling handleContinue when dismissed.
   ** Unlike `disable`, this will show non-dismissed hints normally.
   **/
  skipWithAutoContinue: boolean,
  hintKey: HintKey,
  handleCancel: () => mixed,
  handleContinue: () => mixed,
|}): ?Node => {
  const {
    disable,
    skipWithAutoContinue,
    hintKey,
    handleCancel,
    handleContinue,
  } = args
  const isDismissed = useSelector(selectors.getDismissedHints).includes(hintKey)

  if (disable) return null

  if (skipWithAutoContinue && isDismissed) {
    // continue automatically (as if there is no modal)
    console.log('leeeroooy', { skipWithAutoContinue, isDismissed })
    handleContinue()
  }

  return (
    <BlockingHint
      hintKey={hintKey}
      handleCancel={handleCancel}
      handleContinue={handleContinue}
    />
  )
}

export default useBlockingHint
