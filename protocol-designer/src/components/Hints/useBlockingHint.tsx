// BlockingHint is an "are you sure" modal that can be dismissed.
// Instances of BlockingHint need to be individually placed by whatever component
// is controlling the flow that this modal will block, via useBlockingHint.
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { ContinueModal, DeprecatedCheckboxField } from '@opentrons/components'
import { actions, selectors, HintKey } from '../../tutorial'
import { Portal } from '../portals/MainPageModalPortal'
import { i18n } from '../../localization'
import styles from './hints.module.css'

export interface HintProps {
  hintKey: HintKey
  handleCancel: () => void
  handleContinue: () => void
  content: React.ReactNode
}

// This component handles the checkbox and dispatching `removeHint` action on continue/cancel
export const BlockingHint = (props: HintProps): JSX.Element => {
  const { t } = useTranslation('alert')
  const { hintKey, handleCancel, handleContinue } = props
  const dispatch = useDispatch()

  const [rememberDismissal, setRememberDismissal] = React.useState<boolean>(
    false
  )

  const toggleRememberDismissal = React.useCallback(() => {
    setRememberDismissal(prevDismissal => !prevDismissal)
  }, [])

  const onCancelClick = (): void => {
    dispatch(actions.removeHint(hintKey, rememberDismissal))
    handleCancel()
  }

  const onContinueClick = (): void => {
    dispatch(actions.removeHint(hintKey, rememberDismissal))
    handleContinue()
  }

  return (
    <Portal>
      <ContinueModal
        alertOverlay
        heading={t(`hint.${hintKey}.title`)}
        onCancelClick={onCancelClick}
        onContinueClick={onContinueClick}
      >
        <div className={styles.hint_contents}>{props.content}</div>
        <div>
          <DeprecatedCheckboxField
            className={styles.dont_show_again}
            label={t('hint.dont_show_again')}
            onChange={toggleRememberDismissal}
            value={rememberDismissal}
          />
        </div>
      </ContinueModal>
    </Portal>
  )
}

export interface HintArgs {
  /** `enabled` should be a condition that the parent uses to toggle whether the hint should be active or not.
   * If the hint is enabled but has been dismissed, it will automatically call `handleContinue` when enabled.
   * useBlockingHint expects the parent to disable the hint on cancel/continue */
  enabled: boolean
  hintKey: HintKey
  content: React.ReactNode
  handleCancel: () => void
  handleContinue: () => void
}

export const useBlockingHint = (args: HintArgs): JSX.Element | null => {
  const { enabled, hintKey, handleCancel, handleContinue, content } = args
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
      content={content}
    />
  )
}
