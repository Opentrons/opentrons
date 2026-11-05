import { useHomePipettes } from '/app/local-resources/instruments'

import type { UseHomePipettesProps } from '/app/local-resources/instruments'
import type { ProtocolDropTipModalProps } from './ProtocolDropTipModal'

type UseProtocolDropTipModalProps = Pick<
  UseHomePipettesProps,
  'pipetteInfo'
> & {
  hasPipetteWithTip: boolean
  isPromptDismissed: boolean
  isWizardActive: boolean
  enableDTWiz: () => void
  onSkipAndHome: () => void
  is96Channel?: boolean
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
  isWizardActive,
  enableDTWiz,
  onSkipAndHome,
  pipetteInfo,
  is96Channel = false,
}: UseProtocolDropTipModalProps): UseProtocolDropTipModalResult {
  const { homePipettes, isHoming } = useHomePipettes({
    pipetteInfo,
    onSuccess: onSkipAndHome,
  })

  const showModal = hasPipetteWithTip && !isPromptDismissed && !isWizardActive

  const onSkip = (): void => {
    void homePipettes()
  }

  const onBeginRemoval = (): void => {
    enableDTWiz()
  }

  return showModal
    ? {
        showModal: true,
        modalProps: {
          onSkip,
          onBeginRemoval,
          isPressed: isHoming,
          mount: pipetteInfo?.mount,
          is96Channel,
        },
      }
    : { showModal: false, modalProps: null }
}
