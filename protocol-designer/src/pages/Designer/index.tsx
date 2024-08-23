import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { INFO_TOAST, Tabs } from '@opentrons/components'

import { useKitchen } from '../../organisms/Kitchen/hooks'
import { getDeckSetupForActiveItem } from '../../top-selectors/labware-locations'
import { getFileMetadata } from '../../file-data/selectors'
import { DeckSetupContainer } from './DeckSetup'

export function Designer(): JSX.Element {
  const { t } = useTranslation(['starting_deck_state', 'protocol_steps'])
  const { bakeToast } = useKitchen()
  const deckSetup = useSelector(getDeckSetupForActiveItem)
  const metadata = useSelector(getFileMetadata)
  const [tab, setTab] = React.useState<'startingDeck' | 'protocolSteps'>(
    'startingDeck'
  )
  const { modules, additionalEquipmentOnDeck } = deckSetup
  const hasHardware =
    (modules != null && Object.values(modules).length > 0) ||
    // greater than 1 to account for the default loaded trashBin
    Object.values(additionalEquipmentOnDeck).length > 1

  const startingDeckTab = {
    text: t('protocol_starting_deck'),
    isActive: tab === 'startingDeck',
    onClick: () => {
      setTab('startingDeck')
    },
  }
  const protocolStepTab = {
    text: t('protocol_steps:protocol_steps'),
    isActive: tab === 'protocolSteps',
    onClick: () => {
      setTab('protocolSteps')
    },
  }

  // only display toast if its a newly made protocol
  React.useEffect(() => {
    if (hasHardware && metadata?.lastModified == null) {
      bakeToast(t('add_rest') as string, INFO_TOAST, {
        heading: t('we_added_hardware'),
        closeButton: true,
      })
    }
  }, [hasHardware])

  return (
    <>
      {/* TODO: add these tabs to the nav bar potentially? */}
      <Tabs tabs={[startingDeckTab, protocolStepTab]} />
      {tab === 'startingDeck' ? (
        <DeckSetupContainer />
      ) : (
        <div>TODO wire this up</div>
      )}
    </>
  )
}
