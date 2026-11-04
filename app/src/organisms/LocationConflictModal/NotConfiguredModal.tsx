import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  FixtureOption,
  Flex,
  ListTable,
  Modal,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { useUpdateDeckConfigurationMutation } from '@opentrons/react-api-client'
import {
  getCutoutDisplayName,
  getFixtureDisplayName,
} from '@opentrons/shared-data'

import { getTopPortalEl } from '/app/App/portal'
import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { ODDFixtureOption } from '/app/molecules/ODDFixtureOption'
import { OddModal } from '/app/molecules/OddModal'
import { patchDeckConfigForRequiredFixture } from '/app/organisms/LocationConflictModal/patchDeckConfigForRequiredFixture'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'

import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'
import type { CutoutFixtureId, CutoutId } from '@opentrons/shared-data'

interface NotConfiguredModalProps {
  onCloseClick: () => void
  requiredFixtureId: CutoutFixtureId
  cutoutId: CutoutId
  isOnDevice?: boolean
}

export const NotConfiguredModal = (
  props: NotConfiguredModalProps
): ReactNode => {
  const { onCloseClick, cutoutId, requiredFixtureId, isOnDevice } = props
  const { t, i18n } = useTranslation([
    'protocol_setup',
    'shared',
    'deck_configuration',
  ])
  const documentationState = useDocumentationState()
  const { updateDeckConfiguration } =
    useUpdateDeckConfigurationMutation(documentationState)
  const deckConfig = useNotifyDeckConfigurationQuery()?.data ?? []

  const handleUpdateDeck = (): void => {
    const updatedDeckConfig = patchDeckConfigForRequiredFixture(
      deckConfig,
      cutoutId,
      requiredFixtureId
    )

    updateDeckConfiguration(updatedDeckConfig)
    onCloseClick()
  }
  const cutoutDisplayName = getCutoutDisplayName(cutoutId)
  return createPortal(
    isOnDevice ? (
      <OddModal
        onOutsideClick={onCloseClick}
        header={{
          title: t('add_fixture', {
            fixtureName: getFixtureDisplayName(
              t as TFunction,
              requiredFixtureId
            ),
            locationName: cutoutDisplayName,
          }),
          hasExitIcon: true,
          onClick: onCloseClick,
        }}
      >
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing32}>
          <StyledText oddStyle="bodyTextRegular">
            {t('add_this_deck_hardware')}
          </StyledText>
          <ListTable>
            <ODDFixtureOption
              optionName={getFixtureDisplayName(
                t as TFunction,
                requiredFixtureId
              )}
              onClickHandler={handleUpdateDeck}
              buttonText={i18n.format(t('shared:add'), 'capitalize')}
            />
          </ListTable>
        </Flex>
      </OddModal>
    ) : (
      <Modal
        title={t('add_fixture', {
          fixtureName: getFixtureDisplayName(t as TFunction, requiredFixtureId),
          locationName: cutoutDisplayName,
        })}
        onClose={onCloseClick}
        width="27.75rem"
      >
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('add_this_deck_hardware')}
          </StyledText>
          <ListTable>
            <FixtureOption
              optionName={getFixtureDisplayName(
                t as TFunction,
                requiredFixtureId
              )}
              onClickHandler={handleUpdateDeck}
              buttonText={i18n.format(t('shared:add'), 'capitalize')}
            />
          </ListTable>
        </Flex>
      </Modal>
    ),
    getTopPortalEl()
  )
}
