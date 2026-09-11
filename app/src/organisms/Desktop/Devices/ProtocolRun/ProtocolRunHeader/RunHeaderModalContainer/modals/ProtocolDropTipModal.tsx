import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_END,
  JUSTIFY_SPACE_BETWEEN,
  ModalHeader,
  ModalShell,
  PrimaryButton,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { TextOnlyButton } from '/app/atoms/buttons'
import { useHomePipettes } from '/app/local-resources/instruments'

import type { PipetteData } from '@opentrons/api-client'
import type { IconProps } from '@opentrons/components'
import type { UseHomePipettesProps } from '/app/local-resources/instruments'
import type { TipAttachmentStatusResult } from '/app/resources/instruments'

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

interface ProtocolDropTipModalProps {
  onSkip: () => void
  onBeginRemoval: () => void
  isDisabled: boolean
  mount?: PipetteData['mount']
}

export function ProtocolDropTipModal({
  onSkip,
  onBeginRemoval,
  mount,
  isDisabled,
}: ProtocolDropTipModalProps): JSX.Element {
  const { t } = useTranslation('drop_tip_wizard')

  const buildIcon = (): IconProps => {
    return {
      name: 'information',
      color: COLORS.red50,
      size: SPACING.spacing20,
      style: {
        marginRight: SPACING.spacing8,
      },
    }
  }

  const buildHeader = (): JSX.Element => {
    return (
      <ModalHeader
        title={t('remove_any_attached_tips')}
        icon={buildIcon()}
        color={COLORS.black90}
        backgroundColor={COLORS.white}
      />
    )
  }

  return (
    <ModalShell header={buildHeader()} css={MODAL_STYLE}>
      <Flex
        padding={SPACING.spacing24}
        gridGap={SPACING.spacing24}
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <StyledText desktopStyle="bodyDefaultRegular">
          <Trans
            t={t}
            i18nKey="liquid_damages_this_pipette"
            values={{
              mount,
            }}
            components={{
              mount: <strong />,
            }}
          />
        </StyledText>
        <Flex gridGap={SPACING.spacing24} justifyContent={JUSTIFY_END}>
          {isDisabled ? <Icon name="ot-spinner" spin /> : null}
          <TextOnlyButton
            onClick={onSkip}
            buttonText={t('skip_and_home_pipette')}
            disabled={isDisabled}
          />
          <PrimaryButton onClick={onBeginRemoval} disabled={isDisabled}>
            {t('begin_removal')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </ModalShell>
  )
}

const MODAL_STYLE = css`
  width: 500px;
`
