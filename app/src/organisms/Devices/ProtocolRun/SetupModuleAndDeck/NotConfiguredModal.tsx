import * as React from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useUpdateDeckConfigurationMutation } from '@opentrons/react-api-client'
import {
<<<<<<< HEAD
=======
  useDeckConfigurationQuery,
  useUpdateDeckConfigurationMutation,
} from '@opentrons/react-api-client'
import {
  Flex,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  SPACING,
  JUSTIFY_SPACE_BETWEEN,
  COLORS,
  BORDERS,
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  getCutoutDisplayName,
  getFixtureDisplayName,
} from '@opentrons/shared-data'
import { TertiaryButton } from '../../../../atoms/buttons/TertiaryButton'
import { getTopPortalEl } from '../../../../App/portal'
import { LegacyModal } from '../../../../molecules/LegacyModal'
import { useNotifyDeckConfigurationQuery } from '../../../../resources/deck_configuration'

import type { CutoutFixtureId, CutoutId } from '@opentrons/shared-data'

interface NotConfiguredModalProps {
  onCloseClick: () => void
  requiredFixtureId: CutoutFixtureId
  cutoutId: CutoutId
}

export const NotConfiguredModal = (
  props: NotConfiguredModalProps
): JSX.Element => {
  const { onCloseClick, cutoutId, requiredFixtureId } = props
  const { t, i18n } = useTranslation(['protocol_setup', 'shared'])
  const { updateDeckConfiguration } = useUpdateDeckConfigurationMutation()
  const deckConfig = useNotifyDeckConfigurationQuery()?.data ?? []

  const handleUpdateDeck = (): void => {
    const newDeckConfig = deckConfig.map(fixture =>
      fixture.cutoutId === cutoutId
        ? { ...fixture, cutoutFixtureId: requiredFixtureId }
        : fixture
    )

    updateDeckConfiguration(newDeckConfig)
    onCloseClick()
  }
<<<<<<< HEAD
  const cutoutDisplayName = getCutoutDisplayName(cutoutId)
=======

>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
  return createPortal(
    <LegacyModal
      title={t('add_fixture', {
        fixtureName: getFixtureDisplayName(requiredFixtureId),
<<<<<<< HEAD
        locationName: cutoutDisplayName,
=======
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
      })}
      onClose={onCloseClick}
      width="27.75rem"
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
<<<<<<< HEAD
        <StyledText as="p">{t('add_this_deck_hardware')}</StyledText>
=======
        <StyledText as="p">{t('add_fixture_to_deck')}</StyledText>
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
        <Flex paddingTop={SPACING.spacing16} flexDirection={DIRECTION_COLUMN}>
          <Flex
            padding={`${SPACING.spacing8} ${SPACING.spacing16}`}
            backgroundColor={COLORS.grey30}
<<<<<<< HEAD
            borderRadius={BORDERS.borderRadius8}
=======
            borderRadius={BORDERS.radiusSoftCorners}
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
          >
            <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
              {getFixtureDisplayName(requiredFixtureId)}
            </StyledText>
            <TertiaryButton onClick={handleUpdateDeck}>
              {i18n.format(t('shared:add'), 'capitalize')}
            </TertiaryButton>
          </Flex>
        </Flex>
      </Flex>
    </LegacyModal>,
    getTopPortalEl()
  )
}
