import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { css } from 'styled-components'
import {
  ALIGN_CENTER,
  BORDERS,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { AnnouncementModal } from '../../organisms'
import {
  actions as analyticsActions,
  selectors as analyticsSelectors,
} from '../../analytics'
import {
  actions as tutorialActions,
  selectors as tutorialSelectors,
} from '../../tutorial'
import { BUTTON_LINK_STYLE } from '../../atoms'
import { actions as featureFlagActions } from '../../feature-flags'
import { getFeatureFlagData } from '../../feature-flags/selectors'
import type { FlagTypes } from '../../feature-flags'

export function Settings(): JSX.Element {
  const dispatch = useDispatch()
  const { t } = useTranslation(['feature_flags', 'shared'])
  const [
    showAnnouncementModal,
    setShowAnnouncementModal,
  ] = useState<boolean>(false)
  const hasOptedIn = useSelector(analyticsSelectors.getHasOptedIn)
  const flags = useSelector(getFeatureFlagData)
  const canClearHintDismissals = useSelector(
    tutorialSelectors.getCanClearHintDismissals
  )
  const _toggleOptedIn = hasOptedIn
    ? analyticsActions.optOut
    : analyticsActions.optIn

  const prereleaseModeEnabled = flags.PRERELEASE_MODE === true

  const allFlags = Object.keys(flags) as FlagTypes[]

  const getDescription = (flag: FlagTypes): string => {
    return flag === 'OT_PD_DISABLE_MODULE_RESTRICTIONS'
      ? t(`feature_flags:${flag}.description_1`)
      : t(`feature_flags:${flag}.description`)
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
          data-testid={`btn_${flagName}`}
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
          <Icon name={iconName} size="1rem" />
        </Btn>
      </Flex>
    )
  }

  const prereleaseFlagRows = allFlags.map(toFlagRow)

  return (
    <>
      {showAnnouncementModal ? (
        <AnnouncementModal
          isViewReleaseNotes={showAnnouncementModal}
          onClose={() => {
            setShowAnnouncementModal(false)
          }}
        />
      ) : null}
      <Flex
        backgroundColor={COLORS.grey10}
        width="100%"
        minHeight="calc(100vh - 56px)"
        height="100%"
        padding={`${SPACING.spacing80} 17rem`}
      >
        <Flex
          borderRadius={BORDERS.borderRadius8}
          backgroundColor={COLORS.white}
          padding={SPACING.spacing40}
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing40}
          width="100%"
        >
          <StyledText desktopStyle="headingLargeBold">
            {t('shared:settings')}
          </StyledText>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
            <StyledText desktopStyle="bodyLargeSemiBold">
              {t('shared:app_settings')}
            </StyledText>
            <Flex
              borderRadius={BORDERS.borderRadius4}
              backgroundColor={COLORS.grey10}
              padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
              justifyContent={JUSTIFY_SPACE_BETWEEN}
            >
              <StyledText desktopStyle="bodyDefaultSemiBold">
                {t('shared:pd_version')}
              </StyledText>
              <Flex gridGap={SPACING.spacing12}>
                <StyledText desktopStyle="bodyDefaultRegular">
                  {process.env.OT_PD_VERSION}
                </StyledText>
                <Btn
                  css={BUTTON_LINK_STYLE}
                  textDecoration={TYPOGRAPHY.textDecorationUnderline}
                  onClick={() => {
                    setShowAnnouncementModal(true)
                  }}
                  data-testid="AnnouncementModal_viewReleaseNotesButton"
                >
                  <StyledText desktopStyle="bodyDefaultRegular">
                    {t('shared:view_release_notes')}
                  </StyledText>
                </Btn>
              </Flex>
            </Flex>
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
            <StyledText desktopStyle="bodyLargeSemiBold">
              {t('shared:user_settings')}
            </StyledText>
            <Flex
              borderRadius={BORDERS.borderRadius4}
              backgroundColor={COLORS.grey10}
              padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
              justifyContent={JUSTIFY_SPACE_BETWEEN}
              alignItems={ALIGN_CENTER}
            >
              <Flex flexDirection={DIRECTION_COLUMN}>
                <StyledText desktopStyle="bodyDefaultSemiBold">
                  {t('shared:hints')}
                </StyledText>
                <Flex color={COLORS.grey60}>
                  <StyledText desktopStyle="bodyDefaultRegular">
                    {t('shared:reset_hints_and_tips')}
                  </StyledText>
                </Flex>
              </Flex>
              <Btn
                disabled={!canClearHintDismissals}
                textDecoration={
                  canClearHintDismissals
                    ? TYPOGRAPHY.textDecorationUnderline
                    : 'none'
                }
                onClick={() =>
                  dispatch(tutorialActions.clearAllHintDismissals())
                }
              >
                <StyledText desktopStyle="bodyDefaultRegular">
                  {canClearHintDismissals
                    ? t('shared:reset_hints')
                    : t('shared:no_hints_to_restore')}
                </StyledText>
              </Btn>
            </Flex>
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
            <StyledText desktopStyle="bodyLargeSemiBold">
              {t('shared:privacy')}
            </StyledText>
            <Flex
              borderRadius={BORDERS.borderRadius4}
              backgroundColor={COLORS.grey10}
              padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
              justifyContent={JUSTIFY_SPACE_BETWEEN}
              alignItems={ALIGN_CENTER}
              gridGap={SPACING.spacing80}
            >
              <Flex flexDirection={DIRECTION_COLUMN}>
                <StyledText desktopStyle="bodyDefaultSemiBold">
                  {t('shared:shared_sessions')}
                </StyledText>
                <Flex color={COLORS.grey60}>
                  <StyledText desktopStyle="bodyDefaultRegular">
                    {t('shared:we_are_improving')}
                  </StyledText>
                </Flex>
              </Flex>
              <Btn
                role="switch"
                data-testid="analyticsToggle"
                size="2rem"
                css={
                  Boolean(hasOptedIn)
                    ? TOGGLE_ENABLED_STYLES
                    : TOGGLE_DISABLED_STYLES
                }
                onClick={() => dispatch(_toggleOptedIn())}
              >
                <Icon
                  name={
                    hasOptedIn ? 'ot-toggle-input-on' : 'ot-toggle-input-off'
                  }
                  height="1rem"
                />
              </Btn>
            </Flex>
          </Flex>
          {prereleaseModeEnabled ? (
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
              <StyledText desktopStyle="bodyLargeSemiBold">
                {t('shared:developer_ff')}
              </StyledText>
              <Flex
                borderRadius={BORDERS.borderRadius4}
                backgroundColor={COLORS.grey10}
                padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
                justifyContent={JUSTIFY_SPACE_BETWEEN}
                flexDirection={DIRECTION_COLUMN}
                gridGap={SPACING.spacing16}
              >
                {prereleaseFlagRows}
              </Flex>
            </Flex>
          ) : null}
        </Flex>
      </Flex>
    </>
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
