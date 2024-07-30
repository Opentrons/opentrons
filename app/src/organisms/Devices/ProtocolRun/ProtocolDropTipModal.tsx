import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  StyledText,
  PrimaryButton,
  JUSTIFY_END,
} from '@opentrons/components'

import {
  LegacyModalHeader,
  LegacyModalShell,
} from '../../../molecules/LegacyModal'
import { TextOnlyButton } from '../../../atoms/buttons'

import type { PipetteData } from '@opentrons/api-client'
import type { IconProps } from '@opentrons/components'
import type { TipAttachmentStatusResult } from '../../DropTipWizardFlows'

interface UseProtocolDropTipModalProps {
  areTipsAttached: TipAttachmentStatusResult['areTipsAttached']
  toggleDTWiz: () => void
  /* True if the most recent run is the current run */
  isMostRecentRunCurrent: boolean
}

interface UseProtocolDropTipModalResult {
  showDTModal: boolean
  onDTModalSkip: () => void
  onDTModalRemoval: () => void
}

// Wraps functionality required for rendering the related modal.
export function useProtocolDropTipModal({
  areTipsAttached,
  toggleDTWiz,
  isMostRecentRunCurrent,
}: UseProtocolDropTipModalProps): UseProtocolDropTipModalResult {
  const [showDTModal, setShowDTModal] = React.useState(areTipsAttached)

  React.useEffect(() => {
    if (isMostRecentRunCurrent) {
      setShowDTModal(areTipsAttached)
    } else {
      setShowDTModal(false)
    }
  }, [areTipsAttached, isMostRecentRunCurrent])

  const onDTModalSkip = (): void => {
    setShowDTModal(false)
  }

  const onDTModalRemoval = (): void => {
    toggleDTWiz()
  }

  return { showDTModal, onDTModalSkip, onDTModalRemoval }
}

interface ProtocolDropTipModalProps {
  onSkip: UseProtocolDropTipModalResult['onDTModalSkip']
  onBeginRemoval: UseProtocolDropTipModalResult['onDTModalRemoval']
  mount?: PipetteData['mount']
}

export function ProtocolDropTipModal({
  onSkip,
  onBeginRemoval,
  mount,
}: ProtocolDropTipModalProps): JSX.Element {
  const { t } = useTranslation('drop_tip_wizard')

  const buildIcon = (): IconProps => {
    return {
      name: 'information',
      color: COLORS.red50,
      size: SPACING.spacing20,
      marginRight: SPACING.spacing8,
    }
  }

  const buildHeader = (): JSX.Element => {
    return (
      <LegacyModalHeader
        title={t('remove_attached_tips')}
        icon={buildIcon()}
        color={COLORS.black90}
        backgroundColor={COLORS.white}
      />
    )
  }

  return (
    <LegacyModalShell header={buildHeader()} css={MODAL_STYLE}>
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
          <TextOnlyButton onClick={onSkip} buttonText={t('skip')} />
          <PrimaryButton onClick={onBeginRemoval}>
            {t('begin_removal')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </LegacyModalShell>
  )
}

const MODAL_STYLE = css`
  width: 500px;
`
