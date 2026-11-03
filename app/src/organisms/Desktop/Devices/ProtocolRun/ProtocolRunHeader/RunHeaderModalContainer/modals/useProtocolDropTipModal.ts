import { useEffect, useState } from 'react'

import { useHomePipettes } from '/app/local-resources/instruments'

import type { UseHomePipettesProps } from '/app/local-resources/instruments'
import type { ProtocolDropTipModalProps } from './ProtocolDropTipModal'

type UseProtocolDropTipModalProps = Pick<
  UseHomePipettesProps,
  'pipetteInfo'
> & {
  hasPipetteWithTip: boolean
  isPromptDismissed: boolean
  enableDTWiz: () => void
  onSkipAndHome: () => void
}

export type UseProtocolDropTipModalResult =
  | {
      showModal: true
      modalProps: ProtocolDropTipModalProps
    }
  | { showModal: false; modalProps: null }

// Wraps functionality required for rendering the related modal.
export function useProtocolDropTipModal({
  hasPipetteWithTip,
  isPromptDismissed,
  enableDTWiz,
  onSkipAndHome,
  pipetteInfo,
}: UseProtocolDropTipModalProps): UseProtocolDropTipModalResult {
  const [showModal, setShowModal] = useState(
    hasPipetteWithTip && !isPromptDismissed
  )

  const { homePipettes, isHoming } = useHomePipettes({
    pipetteInfo,
    onSuccess: () => {
      setShowModal(false)
      onSkipAndHome()
    },
  })

  useEffect(() => {
    if (isPromptDismissed) {
      setShowModal(false)
      return
    }
    if (!isHoming) {
      setShowModal(hasPipetteWithTip)
    }
  }, [hasPipetteWithTip, isPromptDismissed, isHoming])

  const onSkip = (): void => {
    void homePipettes()
  }

  const onBeginRemoval = (): void => {
    enableDTWiz()
    setShowModal(false)
  }

  return showModal
    ? {
        showModal: true,
        modalProps: {
          onSkip,
          onBeginRemoval,
          isPressed: isHoming,
        },
      }
    : { showModal: false, modalProps: null }
}
