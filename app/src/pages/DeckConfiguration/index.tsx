import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import isEqual from 'lodash/isEqual'

import {
  DeckConfigurator,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
} from '@opentrons/components'
import {
  useDeckConfigurationQuery,
  useUpdateDeckConfigurationMutation,
} from '@opentrons/react-api-client'
import {
  SINGLE_RIGHT_CUTOUTS,
  SINGLE_LEFT_SLOT_FIXTURE,
  SINGLE_RIGHT_SLOT_FIXTURE,
} from '@opentrons/shared-data'

import { SmallButton } from '../../atoms/buttons'
import { ChildNavigation } from '../../organisms/ChildNavigation'
import { AddFixtureModal } from '../../organisms/DeviceDetailsDeckConfiguration/AddFixtureModal'
import { DeckFixtureSetupInstructionsModal } from '../../organisms/DeviceDetailsDeckConfiguration/DeckFixtureSetupInstructionsModal'
import { DeckConfigurationDiscardChangesModal } from '../../organisms/DeviceDetailsDeckConfiguration/DeckConfigurationDiscardChangesModal'
import { Portal } from '../../App/portal'

import type { CutoutId, DeckConfiguration } from '@opentrons/shared-data'

export function DeckConfigurationEditor(): JSX.Element {
  const { t, i18n } = useTranslation([
    'protocol_setup',
    'devices_landing',
    'shared',
  ])
  const history = useHistory()
  const [
    showSetupInstructionsModal,
    setShowSetupInstructionsModal,
  ] = React.useState<boolean>(false)
  const [
    showConfigurationModal,
    setShowConfigurationModal,
  ] = React.useState<boolean>(false)
  const [targetCutoutId, setTargetCutoutId] = React.useState<CutoutId | null>(
    null
  )
  const [
    showDiscardChangeModal,
    setShowDiscardChangeModal,
  ] = React.useState<boolean>(false)

  const deckConfig = useDeckConfigurationQuery().data ?? []
  const { updateDeckConfiguration } = useUpdateDeckConfigurationMutation()

  const [
    currentDeckConfig,
    setCurrentDeckConfig,
  ] = React.useState<DeckConfiguration>(deckConfig)

  const handleClickAdd = (cutoutId: CutoutId): void => {
    setTargetCutoutId(cutoutId)
    setShowConfigurationModal(true)
  }

  const handleClickRemove = (cutoutId: CutoutId): void => {
    setCurrentDeckConfig(prevDeckConfig =>
      prevDeckConfig.map(fixture =>
        fixture.cutoutId === cutoutId
          ? {
              ...fixture,
              cutoutFixtureId: SINGLE_RIGHT_CUTOUTS.includes(cutoutId)
                ? SINGLE_RIGHT_SLOT_FIXTURE
                : SINGLE_LEFT_SLOT_FIXTURE,
            }
          : fixture
      )
    )
  }

  const handleClickConfirm = (): void => {
    if (!isEqual(deckConfig, currentDeckConfig)) {
      updateDeckConfiguration(currentDeckConfig)
    }
    history.goBack()
  }

  const handleClickBack = (): void => {
    if (!isEqual(deckConfig, currentDeckConfig)) {
      setShowDiscardChangeModal(true)
    } else {
      history.goBack()
    }
  }

  const secondaryButtonProps: React.ComponentProps<typeof SmallButton> = {
    onClick: () => setShowSetupInstructionsModal(true),
    buttonText: i18n.format(t('setup_instructions'), 'titleCase'),
    buttonType: 'tertiaryLowLight',
    iconName: 'information',
    iconPlacement: 'startIcon',
  }

  React.useEffect(() => {
    setCurrentDeckConfig(deckConfig)
  }, [deckConfig])

  return (
    <>
      <Portal level="top">
        {showDiscardChangeModal ? (
          <DeckConfigurationDiscardChangesModal
            setShowConfirmationModal={setShowDiscardChangeModal}
          />
        ) : null}
        {showSetupInstructionsModal ? (
          <DeckFixtureSetupInstructionsModal
            setShowSetupInstructionsModal={setShowSetupInstructionsModal}
            isOnDevice
          />
        ) : null}
        {showConfigurationModal && targetCutoutId != null ? (
          <AddFixtureModal
            cutoutId={targetCutoutId}
            setShowAddFixtureModal={setShowConfigurationModal}
            setCurrentDeckConfig={setCurrentDeckConfig}
            isOnDevice
          />
        ) : null}
      </Portal>
      <Flex flexDirection={DIRECTION_COLUMN}>
        <ChildNavigation
          header={t('devices_landing:deck_configuration')}
          onClickBack={handleClickBack}
          buttonText={t('shared:confirm')}
          onClickButton={handleClickConfirm}
          secondaryButtonProps={secondaryButtonProps}
        />
        <Flex
          marginTop="7.75rem"
          paddingX={SPACING.spacing40}
          paddingBottom={SPACING.spacing40}
          justifyContent={JUSTIFY_CENTER}
        >
          <DeckConfigurator
            deckConfig={currentDeckConfig}
            handleClickAdd={handleClickAdd}
            handleClickRemove={handleClickRemove}
          />
        </Flex>
      </Flex>
    </>
  )
}
