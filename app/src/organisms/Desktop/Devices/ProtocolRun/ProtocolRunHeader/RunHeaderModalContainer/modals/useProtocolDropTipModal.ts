import { useEffect, useState } from 'react'

import { useHomePipettes } from '/app/local-resources/instruments'

import type { UseHomePipettesProps } from '/app/local-resources/instruments'
import type { ProtocolDropTipModalProps } from './ProtocolDropTipModal'

type UseProtocolDropTipModalProps = Pick<
  UseHomePipettesProps,
  'pipetteInfo'
> & {
  hasPipetteWithTip: boolean
  enableDTWiz: () => void
  onSkipAndHome?: () => void
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
  enableDTWiz,
  onSkipAndHome,
  pipetteInfo,
}: UseProtocolDropTipModalProps): UseProtocolDropTipModalResult {
  const [showModal, setShowModal] = useState(hasPipetteWithTip)
  // After skip-and-home, keep the modal closed even if tip state briefly lags.
  const [hasSkipped, setHasSkipped] = useState(false)

  const { homePipettes, isHoming } = useHomePipettes({
    pipetteInfo,
    onSuccess: () => {
      setHasSkipped(true)
      setShowModal(false)
      onSkipAndHome?.()
    },
  })

  useEffect(() => {
    if (hasSkipped) {
      setShowModal(false)
      return
    }
    if (!isHoming) {
      setShowModal(hasPipetteWithTip)
    }
  }, [hasPipetteWithTip, hasSkipped, isHoming])

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
