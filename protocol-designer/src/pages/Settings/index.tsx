import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { selectors as analyticsSelectors } from '/protocol-designer/analytics'
import { AnnouncementModal } from '/protocol-designer/components/organisms'
import {
  AppInfo,
  FeatureFlag,
  Privacy,
  UserSettings,
} from '/protocol-designer/components/organisms/Settings'
import { getFeatureFlagData } from '/protocol-designer/feature-flags/selectors'
import { selectors as tutorialSelectors } from '/protocol-designer/tutorial'

import type { ReactNode } from 'react'

const SETTINGS_MAX_WIDTH = '56rem'

export function Settings(): ReactNode {
  const { t } = useTranslation('shared')
  const [showAnnouncementModal, setShowAnnouncementModal] =
    useState<boolean>(false)
  const flags = useSelector(getFeatureFlagData)
  const canClearHintDismissals = useSelector(
    tutorialSelectors.getCanClearHintDismissals
  )
  const { hasOptedIn } = useSelector(analyticsSelectors.getHasOptedIn)
  const prereleaseModeEnabled = flags.PRERELEASE_MODE === true

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
        width="100%"
        justifyContent={JUSTIFY_CENTER}
        backgroundColor={COLORS.grey10}
        padding={`${SPACING.spacing60} ${SPACING.spacing80} ${SPACING.spacing80}`}
      >
        <Flex width="100%" maxWidth={SETTINGS_MAX_WIDTH} height="100%">
          <Flex
            backgroundColor={COLORS.white}
            padding={SPACING.spacing40}
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing40}
            borderRadius={BORDERS.borderRadius8}
            width="100%"
            height="100%"
          >
            <Flex width="100%" height="100%">
              <StyledText desktopStyle="headingLargeBold">
                {t('settings')}
              </StyledText>
            </Flex>

            <Flex
              height="100%"
              flexDirection={DIRECTION_COLUMN}
              gridGap={SPACING.spacing24}
            >
              <AppInfo setShowAnnouncementModal={setShowAnnouncementModal} />
              <UserSettings
                canClearHintDismissals={canClearHintDismissals}
                flags={flags}
              />
              <Privacy hasOptedIn={hasOptedIn} />
              {prereleaseModeEnabled ? <FeatureFlag flags={flags} /> : null}
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </>
  )
}
