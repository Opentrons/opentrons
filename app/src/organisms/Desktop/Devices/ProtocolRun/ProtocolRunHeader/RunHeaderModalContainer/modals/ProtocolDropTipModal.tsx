import { Trans, useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
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

import type { ReactNode } from 'react'
import type { PipetteData } from '@opentrons/api-client'
import type { IconProps } from '@opentrons/components'

export interface ProtocolDropTipModalProps {
  onSkip: () => void
  onBeginRemoval: () => void
  isPressed: boolean
  mount?: PipetteData['mount']
}

export function ProtocolDropTipModal({
  onSkip,
  onBeginRemoval,
  mount,
  isPressed,
}: ProtocolDropTipModalProps): ReactNode {
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
          <TextOnlyButton
            onClick={onSkip}
            buttonText={t('skip_and_home_pipette')}
            disabled={isPressed}
          />
          <PrimaryButton
            onClick={isPressed ? undefined : onBeginRemoval}
            aria-disabled={isPressed}
            css={isPressed ? PRESSED_LOADING_STATE : undefined}
          >
            <Flex gridGap={SPACING.spacing8} alignItems={ALIGN_CENTER}>
              {isPressed ? (
                <Icon name="ot-spinner" spin size={SPACING.spacing16} />
              ) : null}
              {t('begin_removal')}
            </Flex>
          </PrimaryButton>
        </Flex>
      </Flex>
    </ModalShell>
  )
}

const MODAL_STYLE = css`
  width: 500px;
`

/* Match RecoveryFooterButtons: pressed (blue60) while loading instead of
 * HTML disabled (grey / removed from tab order). */
const PRESSED_LOADING_STATE = css`
  background-color: ${COLORS.blue60};
  cursor: default;

  &:focus {
    background-color: ${COLORS.blue60};
  }

  &:hover {
    background-color: ${COLORS.blue60};
    box-shadow: none;
  }

  &:focus-visible {
    background-color: ${COLORS.blue60};
  }

  &:active {
    background-color: ${COLORS.blue60};
  }

  &[aria-disabled='true'] {
    background-color: ${COLORS.blue60};
    color: ${COLORS.white};
  }
`
