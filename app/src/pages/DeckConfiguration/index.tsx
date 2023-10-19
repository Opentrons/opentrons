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
import { STANDARD_SLOT_LOAD_NAME } from '@opentrons/shared-data'

import { SmallButton } from '../../atoms/buttons'
import { ChildNavigation } from '../../organisms/ChildNavigation'
import { AddFixtureModal } from '../../organisms/DeviceDetailsDeckConfiguration/AddFixtureModal'
import { DeckFixtureSetupInstructionsModal } from '../../organisms/DeviceDetailsDeckConfiguration/DeckFixtureSetupInstructionsModal'
import { DeckConfigurationDiscardChangesModal } from '../../organisms/DeviceDetailsDeckConfiguration/DeckConfigurationDiscardChangesModal'
import { Portal } from '../../App/portal'

import type { Cutout, DeckConfiguration, Fixture } from '@opentrons/shared-data'

// type ExtendedDeckConfiguration = Array<Fixture | Omit<Fixture, 'fixtureId'>>
export interface DeckConfigData {
  addedFixture: Omit<Fixture, 'fixtureId'> | null
  // currentDeckConfig: ExtendedDeckConfiguration
  currentDeckConfig: DeckConfiguration
}

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

  const [deckConfigData, setDeckConfigData] = React.useState<DeckConfigData>({
    addedFixture: null,
    currentDeckConfig: deckConfig,
  })

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
    if (
      !isEqual(deckConfig, deckConfigData.currentDeckConfig) &&
      deckConfigData.addedFixture != null
    )
      updateDeckConfiguration(deckConfigData.addedFixture)
    setDeckConfigData({
      addedFixture: null,
      currentDeckConfig: deckConfigData.currentDeckConfig,
    })
  }

  const handleClickBack = (): void => {
    // ToDo If there is any unsaved change, display DeckConfigurationDiscardChangesModal
    if (
      !isEqual(deckConfig, deckConfigData.currentDeckConfig) &&
      deckConfigData.addedFixture != null
    ) {
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
          <AddFixtureModal
            fixtureLocation={targetFixtureLocation}
            setShowAddFixtureModal={setShowConfigurationModal}
            deckConfigData={deckConfigData}
            setDeckConfigData={setDeckConfigData}
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
            deckConfig={deckConfigData.currentDeckConfig}
            handleClickAdd={handleClickAdd}
            handleClickRemove={handleClickRemove}
          />
        </Flex>
      </Flex>
    </>
  )
}
