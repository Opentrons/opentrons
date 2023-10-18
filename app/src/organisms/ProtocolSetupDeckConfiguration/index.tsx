import * as React from 'react'
import { useTranslation } from 'react-i18next'

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

import { ChildNavigation } from '../ChildNavigation'
import { AddFixtureModal } from '../DeviceDetailsDeckConfiguration/AddFixtureModal'
import { DeckFixtureSetupInstructionsModal } from '../DeviceDetailsDeckConfiguration/DeckFixtureSetupInstructionsModal'
import { DeckConfigurationDiscardChangesModal } from '../DeviceDetailsDeckConfiguration/DeckConfigurationDiscardChangesModal'
import { Portal } from '../../App/portal'

import type { Cutout } from '@opentrons/shared-data'
import type { SetupScreens } from '../../pages/OnDeviceDisplay/ProtocolSetup'

interface ProtocolSetupDeckConfigurationProps {
  fixtureLocation: Cutout | null
  setSetupScreen: React.Dispatch<React.SetStateAction<SetupScreens>>
}

export function ProtocolSetupDeckConfiguration({
  fixtureLocation,
  setSetupScreen,
}: ProtocolSetupDeckConfigurationProps): JSX.Element {
  const { t } = useTranslation(['protocol_setup', 'devices_landing', 'shared'])

  const [
    showSetupInstructionsModal,
    setShowSetupInstructionsModal,
  ] = React.useState<boolean>(false)
  const [
    showConfigurationModal,
    setShowConfigurationModal,
  ] = React.useState<boolean>(true)
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
    // ToDo (kk:10/17/2023) add a function for the confirmation in a following PR for RAUT-804
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
        {showConfigurationModal &&
        (fixtureLocation != null || targetFixtureLocation != null) ? (
          <AddFixtureModal
            fixtureLocation={
              targetFixtureLocation != null
                ? targetFixtureLocation
                : fixtureLocation
            }
            setShowAddFixtureModal={setShowConfigurationModal}
            isOnDevice
          />
        ) : null}
      </Portal>
      <Flex flexDirection={DIRECTION_COLUMN}>
        <ChildNavigation
          header={t('devices_landing:deck_configuration')}
          onClickBack={() => setSetupScreen('modules')}
          buttonText={t('shared:confirm')}
          onClickButton={handleClickConfirm}
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
