import * as React from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'

import {
  DeckConfigurator,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_AROUND,
} from '@opentrons/components'

import { ChildNavigation } from '../../organisms/ChildNavigation'
import { DeckFixtureSetupInstructionsModal } from '../../organisms/DeviceDetailsDeckConfiguration/DeckFixtureSetupInstructionsModal'
import { DeckConfigurationDiscardChangesModal } from '../../organisms/DeviceDetailsDeckConfiguration/DeckConfigurationDiscardChangesModal'
import { getTopPortalEl } from '../../App/portal'
<<<<<<< HEAD
import {
  useDeckConfigurationEditingTools,
  useNotifyDeckConfigurationQuery,
} from '../../resources/deck_configuration'
=======

<<<<<<< HEAD
import type { CutoutId, DeckConfiguration } from '@opentrons/shared-data'
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
=======
import type {
  CutoutFixtureId,
  CutoutId,
  DeckConfiguration,
} from '@opentrons/shared-data'
import type { SmallButton } from '../../atoms/buttons'
>>>>>>> f3c86ff7d8 (fix(app, components, protocol-designer, shared-data): import type lint rule to error, fix occurrences (#15168))

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

  const isOnDevice = true
  const {
    addFixtureToCutout,
    removeFixtureFromCutout,
    addFixtureModal,
  } = useDeckConfigurationEditingTools(isOnDevice)

  const [
    showDiscardChangeModal,
    setShowDiscardChangeModal,
  ] = React.useState<boolean>(false)

  const deckConfig = useNotifyDeckConfigurationQuery().data ?? []

  const handleClickConfirm = (): void => {
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
      {createPortal(
        <>
          {showDiscardChangeModal ? (
            <DeckConfigurationDiscardChangesModal
              setShowConfirmationModal={setShowDiscardChangeModal}
            />
          ) : null}
          {showSetupInstructionsModal ? (
            <DeckFixtureSetupInstructionsModal
              setShowSetupInstructionsModal={setShowSetupInstructionsModal}
<<<<<<< HEAD
              isOnDevice={isOnDevice}
            />
          ) : null}
          {addFixtureModal}
=======
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
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
        </>,
        getTopPortalEl()
      )}
      <Flex
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_SPACE_AROUND}
      >
        <ChildNavigation
          header={t('devices_landing:deck_configuration')}
          buttonText={i18n.format(t('shared:save'), 'capitalize')}
          onClickButton={handleClickConfirm}
          secondaryButtonProps={secondaryButtonProps}
        />
        <Flex marginTop="7.75rem" justifyContent={JUSTIFY_CENTER}>
          <DeckConfigurator
            deckConfig={deckConfig}
            handleClickAdd={addFixtureToCutout}
            handleClickRemove={removeFixtureFromCutout}
          />
        </Flex>
      </Flex>
    </>
  )
}
