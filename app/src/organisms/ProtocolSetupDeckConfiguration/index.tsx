import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  DeckConfigurator,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
} from '@opentrons/components'
import { useCreateDeckConfigurationMutation } from '@opentrons/react-api-client'
import {
  STANDARD_SLOT_LOAD_NAME,
  WASTE_CHUTE_LOAD_NAME,
} from '@opentrons/shared-data'

import { ChildNavigation } from '../ChildNavigation'
import { AddFixtureModal } from '../DeviceDetailsDeckConfiguration/AddFixtureModal'
import { DeckConfigurationDiscardChangesModal } from '../DeviceDetailsDeckConfiguration/DeckConfigurationDiscardChangesModal'
import { useMostRecentCompletedAnalysis } from '../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { Portal } from '../../App/portal'

import type {
  Cutout,
  DeckConfiguration,
  Fixture,
  FixtureLoadName,
  LoadFixtureRunTimeCommand,
} from '@opentrons/shared-data'
import type { SetupScreens } from '../../pages/OnDeviceDisplay/ProtocolSetup'

interface ProtocolSetupDeckConfigurationProps {
  fixtureLocation: Cutout
  runId: string
  setSetupScreen: React.Dispatch<React.SetStateAction<SetupScreens>>
  providedFixtureOptions: FixtureLoadName[]
}

export function ProtocolSetupDeckConfiguration({
  fixtureLocation,
  runId,
  setSetupScreen,
  providedFixtureOptions,
}: ProtocolSetupDeckConfigurationProps): JSX.Element {
  const { t } = useTranslation(['protocol_setup', 'devices_landing', 'shared'])

  const [
    showConfigurationModal,
    setShowConfigurationModal,
  ] = React.useState<boolean>(true)
  const [
    targetFixtureLocation,
    setTargetFixtureLocation,
  ] = React.useState<Cutout>(fixtureLocation)
  const [
    showDiscardChangeModal,
    setShowDiscardChangeModal,
  ] = React.useState<boolean>(false)

  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)
  const STUBBED_LOAD_FIXTURE: LoadFixtureRunTimeCommand = {
    id: 'stubbed_load_fixture',
    commandType: 'loadFixture',
    params: {
      fixtureId: 'stubbedFixtureId',
      loadName: WASTE_CHUTE_LOAD_NAME,
      location: { cutout: 'D3' },
    },
    createdAt: 'fakeTimestamp',
    startedAt: 'fakeTimestamp',
    completedAt: 'fakeTimestamp',
    status: 'succeeded',
  }

  const requiredFixtureDetails =
    mostRecentAnalysis?.commands != null
      ? [
          // parseInitialLoadedFixturesByCutout(mostRecentAnalysis.commands),
          STUBBED_LOAD_FIXTURE,
        ]
      : []

  const deckConfig =
    (requiredFixtureDetails.map(
      (fixture): Fixture | false =>
        fixture.params.fixtureId != null && {
          fixtureId: fixture.params.fixtureId,
          fixtureLocation: fixture.params.location.cutout,
          loadName: fixture.params.loadName,
        }
    ) as DeckConfiguration) ?? []

  const [
    currentDeckConfig,
    setCurrentDeckConfig,
  ] = React.useState<DeckConfiguration>(deckConfig)

  const { createDeckConfiguration } = useCreateDeckConfigurationMutation()

  const handleClickAdd = (fixtureLocation: Cutout): void => {
    setTargetFixtureLocation(fixtureLocation)
    setShowConfigurationModal(true)
  }

  const handleClickRemove = (fixtureLocation: Cutout): void => {
    setCurrentDeckConfig(prevDeckConfig =>
      prevDeckConfig.map(fixture =>
        fixture.fixtureLocation === fixtureLocation
          ? { ...fixture, loadName: STANDARD_SLOT_LOAD_NAME }
          : fixture
      )
    )
    createDeckConfiguration(currentDeckConfig)
  }

  const handleClickConfirm = (): void => {
    createDeckConfiguration(currentDeckConfig)
  }

  return (
    <>
      <Portal level="top">
        {showDiscardChangeModal ? (
          <DeckConfigurationDiscardChangesModal
            setShowConfirmationModal={setShowDiscardChangeModal}
          />
        ) : null}
        {showConfigurationModal &&
        (fixtureLocation != null || targetFixtureLocation != null) ? (
          <AddFixtureModal
            fixtureLocation={targetFixtureLocation}
            setShowAddFixtureModal={setShowConfigurationModal}
            providedFixtureOptions={providedFixtureOptions}
            setCurrentDeckConfig={setCurrentDeckConfig}
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
          justifyContent={JUSTIFY_CENTER}
        >
          {/* DeckConfigurator will be replaced by BaseDeck when RAUT-793 is ready */}
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
