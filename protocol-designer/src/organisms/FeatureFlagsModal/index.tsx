import * as React from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { css } from 'styled-components'
import {
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_END,
  JUSTIFY_SPACE_BETWEEN,
  Modal,
  PrimaryButton,
  SPACING,
  SecondaryButton,
  StyledText,
} from '@opentrons/components'
import { getFeatureFlagData } from '../../feature-flags/selectors'
import { getTopPortalEl } from '../../components/portals/TopPortal'
import {
  userFacingFlags,
  actions as featureFlagActions,
} from '../../feature-flags'

import type { FlagTypes } from '../../feature-flags'

interface FeatureFlagsModalProps {
  setShowFeatureFlags: React.Dispatch<React.SetStateAction<boolean>>
  setIsPaused: React.Dispatch<React.SetStateAction<boolean>>
  setIsStopped: React.Dispatch<React.SetStateAction<boolean>>
  isStopped: boolean
}
export function FeatureFlagsModal(props: FeatureFlagsModalProps): JSX.Element {
  const { setShowFeatureFlags, setIsPaused, setIsStopped, isStopped } = props
  const { t } = useTranslation(['feature_flags', 'shared'])
  const flags = useSelector(getFeatureFlagData)
  const dispatch = useDispatch()
  const allFlags = Object.keys(flags) as FlagTypes[]

  const prereleaseFlagNames = allFlags.filter(
    flagName => !userFacingFlags.includes(flagName)
  )

  const getDescription = (flag: FlagTypes): string => {
    return t(`feature_flags:${flag}.description`)
  }

  const setFeatureFlags = (
    flags: Partial<Record<FlagTypes, boolean | null | undefined>>
  ): void => {
    dispatch(featureFlagActions.setFeatureFlags(flags))
  }

  const toFlagRow = (flagName: FlagTypes): JSX.Element => {
    const iconName = Boolean(flags[flagName])
      ? 'ot-toggle-input-on'
      : 'ot-toggle-input-off'

    return (
      <Flex key={flagName} justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <Flex flexDirection={DIRECTION_COLUMN}>
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {t(`feature_flags:${flagName}.title`)}
          </StyledText>
          <StyledText desktopStyle="bodyDefaultRegular">
            {getDescription(flagName)}
          </StyledText>
        </Flex>
        <Btn
          role="switch"
          aria-checked={Boolean(flags[flagName])}
          size="2rem"
          css={
            Boolean(flags[flagName])
              ? TOGGLE_ENABLED_STYLES
              : TOGGLE_DISABLED_STYLES
          }
          onClick={() => {
            setFeatureFlags({
              [flagName as string]: !flags[flagName],
            })
          }}
        >
          <Icon name={iconName} height="1rem" />
        </Btn>
      </Flex>
    )
  }

  const prereleaseFlagRows = prereleaseFlagNames.map(toFlagRow)

  return createPortal(
    <Modal
      width="40rem"
      type="warning"
      title="Developer Feature Flags"
      onClose={() => {
        setShowFeatureFlags(false)
        setIsPaused(false)
      }}
      footer={
        <Flex
          padding={SPACING.spacing16}
          justifyContent={JUSTIFY_END}
          gridGap={SPACING.spacing8}
        >
          <SecondaryButton
            onClick={() => {
              setIsStopped(prev => !prev)
              setIsPaused(false)
            }}
          >
            {isStopped ? 'Resume bounce' : 'Stop ball from bouncing'}
          </SecondaryButton>
          <PrimaryButton
            onClick={() => {
              setShowFeatureFlags(false)
            }}
          >
            {t('shared:close')}
          </PrimaryButton>
        </Flex>
      }
      closeOnOutsideClick
    >
      <StyledText desktopStyle="bodyDefaultRegular">
        For internal use only.
      </StyledText>
      <Flex
        flexDirection="column"
        marginTop={SPACING.spacing16}
        gridGap={SPACING.spacing16}
      >
        {prereleaseFlagRows}
      </Flex>
    </Modal>,
    getTopPortalEl()
  )
}

const TOGGLE_DISABLED_STYLES = css`
  color: ${COLORS.grey50};

  &:hover {
    color: ${COLORS.grey55};
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.yellow50};
  }

  &:disabled {
    color: ${COLORS.grey30};
  }
`

const TOGGLE_ENABLED_STYLES = css`
  color: ${COLORS.blue50};

  &:hover {
    color: ${COLORS.blue55};
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.yellow50};
  }

  &:disabled {
    color: ${COLORS.grey30};
  }
`
