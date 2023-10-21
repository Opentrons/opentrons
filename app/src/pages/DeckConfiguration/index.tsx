import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'

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
import { STANDARD_SLOT_LOAD_NAME } from '@opentrons/shared-data'

import { SmallButton } from '../../atoms/buttons'
import { ChildNavigation } from '../../organisms/ChildNavigation'
import { AddDeckConfigurationModal } from '../../organisms/DeviceDetailsDeckConfiguration/AddDeckConfigurationModal'
import { DeckFixtureSetupInstructionsModal } from '../../organisms/DeviceDetailsDeckConfiguration/DeckFixtureSetupInstructionsModal'
import { DeckConfigurationDiscardChangesModal } from '../../organisms/DeviceDetailsDeckConfiguration/DeckConfigurationDiscardChangesModal'
import { Portal } from '../../App/portal'

import type { Cutout } from '@opentrons/shared-data'

export function DeckConfiguration(): JSX.Element {
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
  const [
    targetFixtureLocation,
    setTargetFixtureLocation,
  ] = React.useState<Cutout | null>(null)
  const [
    showDiscardChangeModal,
    setShowDiscardChangeModal,
  ] = React.useState<boolean>(false)

  const deckConfig = useDeckConfigurationQuery().data ?? []
  const { updateDeckConfiguration } = useUpdateDeckConfigurationMutation()

  const handleClickAdd = (fixtureLocation: Cutout): void => {
    setTargetFixtureLocation(fixtureLocation)
    setShowConfigurationModal(true)
  }

  const handleClickRemove = (fixtureLocation: Cutout): void => {
    updateDeckConfiguration({
      fixtureLocation,
      loadName: STANDARD_SLOT_LOAD_NAME,
    })
  }

  const handleClickConfirm = (): void => {
    // ToDo (kk:10/13/2023) add a function for the confirmation
  }

  const handleClickBack = (): void => {
    // ToDo If there is any unsaved change, display DeckConfigurationDiscardChangesModal
    // setShowDiscardChangeModal(true)
    history.goBack()
  }

  const secondaryButtonProps: React.ComponentProps<typeof SmallButton> = {
    onClick: () => setShowSetupInstructionsModal(true),
    buttonText: i18n.format(t('setup_instructions'), 'titleCase'),
    buttonType: 'tertiaryLowLight',
    iconName: 'information',
    iconPlacement: 'startIcon',
  }

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
        {showConfigurationModal && targetFixtureLocation != null ? (
          <AddDeckConfigurationModal
            fixtureLocation={targetFixtureLocation}
            setShowAddFixtureModal={setShowConfigurationModal}
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
            deckConfig={deckConfig}
            handleClickAdd={handleClickAdd}
            handleClickRemove={handleClickRemove}
          />
        </Flex>
      </Flex>
    </>
  )
}
