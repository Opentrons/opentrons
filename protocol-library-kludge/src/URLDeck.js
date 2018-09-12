// @flow
import React from 'react'
import startCase from 'lodash/startCase'
import styles from './URLDeck.css'
import {
  ContainerNameOverlay,
  Deck,
  Labware,
  Module,
} from '@opentrons/components'
import type {
  DeckSlot,
  LabwareComponentProps,
  ModuleType,
} from '@opentrons/components'

// URI-encoded JSON expected as URL param "data" (eg `?data=...`)
type UrlData = {
  labware: {
    [DeckSlot]: {
      labwareType: string,
      name: ?string,
    },
  },
  modules: {
    [DeckSlot]: ModuleType,
  },
}

function getDataFromUrl (): ?UrlData {
  try {
    const urlData = JSON.parse(new URLSearchParams(window.location.search).get('data'))
    return urlData
  } catch (e) {
    console.error('Failed to parse "data" URL param.', e)
    return null
  }
}

export default class URLDeck extends React.Component<{}> {
  urlData: ?UrlData

  constructor () {
    super()
    this.urlData = getDataFromUrl()
  }

  getLabwareComponent = (args: LabwareComponentProps) => {
    const {slot} = args
    const {urlData} = this
    if (!urlData) return null

    const labwareData = urlData.labware && urlData.labware[slot]
    const moduleData = urlData.modules && urlData.modules[slot]
    let labware = null
    let module = null

    if (labwareData) {
      const {name, labwareType} = labwareData
      const displayLabwareType = startCase(labwareType)
      labware = (
        <React.Fragment>
          <Labware labwareType={labwareType} />
          <ContainerNameOverlay
            title={name || displayLabwareType}
            subtitle={name ? displayLabwareType : null}
          />
        </React.Fragment>
      )
    }

    if (moduleData) {
      module = <Module mode='default' name='tempdeck' />
    }

    return (
      <React.Fragment>
        {module}
        {labware}
      </React.Fragment>
    )
  }

  render () {
    return (
      <Deck
        className={styles.url_deck}
        LabwareComponent={this.getLabwareComponent}
      />
    )
  }
}
