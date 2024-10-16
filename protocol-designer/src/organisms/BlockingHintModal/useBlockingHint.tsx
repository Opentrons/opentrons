import { useSelector } from 'react-redux'
import { HintKey } from '../../tutorial'
import { getDismissedHints } from '../../tutorial/selectors'
import { BlockingHintModal } from './index'

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
  const isDismissed = useSelector(getDismissedHints).includes(hintKey)

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
    <BlockingHintModal
      hintKey={hintKey}
      handleCancel={handleCancel}
      handleContinue={handleContinue}
      content={content}
    />
  )
}
