import * as React from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import {
  useDeckConfigurationQuery,
  useUpdateDeckConfigurationMutation,
} from '@opentrons/react-api-client'
import {
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
import { getFixtureDisplayName } from '@opentrons/shared-data'
import { TertiaryButton } from '../../../../atoms/buttons/TertiaryButton'
import { getTopPortalEl } from '../../../../App/portal'
import { LegacyModal } from '../../../../molecules/LegacyModal'

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
  const deckConfig = useDeckConfigurationQuery()?.data ?? []

  const handleUpdateDeck = (): void => {
    const newDeckConfig = deckConfig.map(fixture =>
      fixture.cutoutId === cutoutId
        ? { ...fixture, cutoutFixtureId: requiredFixtureId }
        : fixture
    )

    updateDeckConfiguration(newDeckConfig)
    onCloseClick()
  }

  return createPortal(
    <LegacyModal
      title={t('add_fixture', {
        fixtureName: getFixtureDisplayName(requiredFixtureId),
      })}
      onClose={onCloseClick}
      width="27.75rem"
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <StyledText as="p">{t('add_fixture_to_deck')}</StyledText>
        <Flex paddingTop={SPACING.spacing16} flexDirection={DIRECTION_COLUMN}>
          <Flex
            padding={`${SPACING.spacing8} ${SPACING.spacing16}`}
            backgroundColor={COLORS.grey30}
            borderRadius={BORDERS.borderRadius8}
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
