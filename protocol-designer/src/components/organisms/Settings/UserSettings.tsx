import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import {
  ALIGN_CENTER,
  BasicButton,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  ListItem,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { ToggleButton } from '/protocol-designer/components/atoms/ToggleButton'
import { actions as featureFlagActions } from '/protocol-designer/feature-flags'
import { actions as tutorialActions } from '/protocol-designer/tutorial'

import type { FlagTypes } from '/protocol-designer/feature-flags'

const userFacingFlags: FlagTypes[] = [
  'OT_PD_ENABLE_HOT_KEYS_DISPLAY',
  'OT_PD_DISABLE_MODULE_RESTRICTIONS',
]

interface UserSettingsProps {
  canClearHintDismissals: boolean
  flags: Partial<Record<FlagTypes, boolean | null | undefined>>
}

export function UserSettings({
  canClearHintDismissals,
  flags,
}: UserSettingsProps): JSX.Element {
  const { t } = useTranslation(['feature_flags', 'shared'])
  const dispatch = useDispatch()
  const setFeatureFlags = (
    flags: Partial<Record<FlagTypes, boolean | null | undefined>>
  ): void => {
    dispatch(featureFlagActions.setFeatureFlags(flags))
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing8}
      height="100%"
    >
      <Flex>
        <StyledText desktopStyle="bodyLargeSemiBold">
          {t('shared:user_settings')}
        </StyledText>
      </Flex>
      <ListItem
        padding={SPACING.spacing16}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        type="default"
      >
        <Flex flexDirection={DIRECTION_COLUMN}>
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {t('shared:hints')}
          </StyledText>
          <Flex color={COLORS.grey60}>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('shared:show_hints_and_tips')}
            </StyledText>
          </Flex>
        </Flex>
        <BasicButton
          onClick={() => dispatch(tutorialActions.clearAllHintDismissals())}
          underLine={canClearHintDismissals}
          isDisabled={!canClearHintDismissals}
        >
          {canClearHintDismissals
            ? t('shared:reset')
            : t('shared:no_hints_to_restore')}
        </BasicButton>
      </ListItem>
      {userFacingFlags.map(flag => (
        <ListItem
          key={flag}
          padding={SPACING.spacing16}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          type="default"
          gridGap={SPACING.spacing40}
          alignItems={ALIGN_CENTER}
        >
          <Flex flexDirection={DIRECTION_COLUMN}>
            <StyledText desktopStyle="bodyDefaultSemiBold">
              {t(`${flag}.title`)}
            </StyledText>
            <Flex color={COLORS.grey60}>
              <StyledText desktopStyle="bodyDefaultRegular">
                {t(`${flag}.description`)}
              </StyledText>
            </Flex>
          </Flex>
          <ToggleButton
            label={`Settings_${flag}`}
            toggledOn={Boolean(flags[flag])}
            onClick={() => {
              setFeatureFlags({
                [flag]: !flags[flag],
              })
            }}
          />
        </ListItem>
      ))}
    </Flex>
  )
}
