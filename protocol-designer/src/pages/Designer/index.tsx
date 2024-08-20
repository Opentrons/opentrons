import * as React from 'react'

import { Tabs } from '@opentrons/components'

import { useTranslation } from 'react-i18next'
import { DeckSetupContainer } from './DeckSetup'

export function Designer(): JSX.Element {
  const { t } = useTranslation(['starting_deck_state', 'protocol_steps'])
  const [tab, setTab] = React.useState<'startingDeck' | 'protocolSteps'>(
    'startingDeck'
  )
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
