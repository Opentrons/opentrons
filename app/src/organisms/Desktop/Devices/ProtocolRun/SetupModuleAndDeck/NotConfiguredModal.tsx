import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useUpdateDeckConfigurationMutation } from '@opentrons/react-api-client'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  LegacyStyledText,
  Modal,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  getCutoutDisplayName,
  getFixtureDisplayName,
} from '@opentrons/shared-data'
import { TertiaryButton } from '/app/atoms/buttons/TertiaryButton'
import { getTopPortalEl } from '/app/App/portal'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'

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
  const cutoutDisplayName = getCutoutDisplayName(cutoutId)
  return createPortal(
    <Modal
      title={t('add_fixture', {
        fixtureName: getFixtureDisplayName(requiredFixtureId),
        locationName: cutoutDisplayName,
      })}
      onClose={onCloseClick}
      width="27.75rem"
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <LegacyStyledText as="p">
          {t('add_this_deck_hardware')}
        </LegacyStyledText>
        <Flex paddingTop={SPACING.spacing16} flexDirection={DIRECTION_COLUMN}>
          <Flex
            padding={`${SPACING.spacing8} ${SPACING.spacing16}`}
            backgroundColor={COLORS.grey30}
            borderRadius={BORDERS.borderRadius8}
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
          >
            <LegacyStyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
              {getFixtureDisplayName(requiredFixtureId)}
            </LegacyStyledText>
            <TertiaryButton onClick={handleUpdateDeck}>
              {i18n.format(t('shared:add'), 'capitalize')}
            </TertiaryButton>
          </Flex>
        </Flex>
      </Flex>
    </Modal>,
    getTopPortalEl()
  )
}
