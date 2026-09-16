import { useEffect, useState } from 'react'

import { useHomePipettes } from '/app/local-resources/instruments'

import type { UseHomePipettesProps } from '/app/local-resources/instruments'
import type { TipAttachmentStatusResult } from '/app/resources/instruments'
import type { ProtocolDropTipModalProps } from './ProtocolDropTipModal'

type UseProtocolDropTipModalProps = Pick<
  UseHomePipettesProps,
  'pipetteInfo'
> & {
  areTipsAttached: TipAttachmentStatusResult['areTipsAttached']
  enableDTWiz: () => void
  currentRunId: string
  onSkipAndHome: () => void
  /* True if the most recent run is the current run */
  isRunCurrent: boolean
}

export type UseProtocolDropTipModalResult =
  | {
      showModal: true
      modalProps: ProtocolDropTipModalProps
    }
  | { showModal: false; modalProps: null }

// Wraps functionality required for rendering the related modal.
export function useProtocolDropTipModal({
  areTipsAttached,
  enableDTWiz,
  isRunCurrent,
  onSkipAndHome,
  pipetteInfo,
}: UseProtocolDropTipModalProps): UseProtocolDropTipModalResult {
  const [showModal, setShowModal] = useState(areTipsAttached)
  // After skip-and-home, keep the modal closed even if tip state / run
  // currentness briefly lag after close is requested.
  const [hasSkipped, setHasSkipped] = useState(false)

  const { homePipettes, isHoming } = useHomePipettes({
    pipetteInfo,
    onSuccess: () => {
      setHasSkipped(true)
      setShowModal(false)
      onSkipAndHome()
    },
  })

  // Close the modal if a different app closes the run context.
  useEffect(
    () => {
      if (hasSkipped) {
        setShowModal(false)
        return
      }
      if (isRunCurrent && !isHoming) {
        setShowModal(areTipsAttached)
      } else if (!isRunCurrent) {
        setShowModal(false)
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isRunCurrent, areTipsAttached, showModal, hasSkipped]
  ) // Continue to show the modal if a client dismisses the maintenance run on a different app.

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
          isDisabled: isHoming,
        },
      }
    : { showModal: false, modalProps: null }
}
