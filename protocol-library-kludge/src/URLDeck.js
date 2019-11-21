// @flow
import React, { Fragment, type Node } from 'react'
import startCase from 'lodash/startCase'
import map from 'lodash/map'
import styles from './URLDeck.css'

import {
  ContainerNameOverlay,
  RobotWorkSpace,
  Labware,
  Module,
} from '@opentrons/components'
import { getDeckDefinitions } from '@opentrons/components/src/deck/getDeckDefinitions'
import type { LabwareComponentProps } from '@opentrons/components'
import type { ModuleType, DeckSlotId } from '@opentrons/shared-data'

// URI-encoded JSON expected as URL param "data" (eg `?data=...`)
type UrlData = {
  labware: {
    [DeckSlotId]: {
      labwareType: string,
      name: ?string,
    },
  },
  modules: {
    [DeckSlotId]: ModuleType,
  },
}

const DECK_DEF = getDeckDefinitions()['ot2_standard']

function getDataFromUrl(): ?UrlData {
  try {
    const urlData = new URLSearchParams(window.location.search).get('data')

    if (!urlData) {
      console.error('No "data" param in URL')
      return null
    }

    return JSON.parse(urlData)
  } catch (e) {
    console.error('Failed to parse "data" URL param.', e)
    return null
  }
}

export default class URLDeck extends React.Component<{}> {
  urlData: ?UrlData

  constructor() {
    super()
    this.urlData = getDataFromUrl()
  }

  getLabwareComponent = (args: LabwareComponentProps) => {
    const { slot } = args
    const { urlData } = this
    if (!urlData) return null

    const labwareData = urlData.labware && urlData.labware[slot]
    const moduleData = urlData.modules && urlData.modules[slot]
    let labware = null
    let module = null

    if (labwareData) {
      const { name, labwareType } = labwareData
      const displayLabwareType = startCase(labwareType)
      labware = (
        <>
          <Labware labwareType={labwareType} />
          <ContainerNameOverlay
            title={name || displayLabwareType}
            subtitle={name ? displayLabwareType : null}
          />
        </>
      )
    }

    if (moduleData) {
      module = <Module mode="default" name="tempdeck" />
    }

    return (
      <>
        {module}
        {labware}
      </>
    )
  }

  render() {
    const labwareBySlot = this.urlData?.labware
    const modulesBySlot = this.urlData?.modules

    return (
      <RobotWorkSpace
        deckDef={DECK_DEF}
        viewBox={`-25 -25 ${488} ${390}`} // TODO: put these in variables
        className={styles.url_deck}
        LabwareComponent={this.getLabwareComponent}
      >
        {({ deckSlotsById }): Array<Node> =>
          Object.keys(deckSlotsById).map((slotId): Node => {
            const slot = deckSlotsById[slotId]
            if (!slot.matingSurfaceUnitVector) return null // if slot has no mating surface, don't render anything in it
            const moduleInSlot = modulesBySlot && modulesBySlot[slotId]
            const allLabwareInSlot = labwareBySlot && labwareBySlot[slotId]

            return (
              <Fragment key={slotId}>
                {moduleInSlot && (
                  <g
                    transform={`translate(${slot.position[0]}, ${
                      slot.position[1]
                    })`}
                  >
                    <Module name={moduleInSlot} mode={'default'} />
                  </g>
                )}
                {allLabwareInSlot &&
                  map(allLabwareInSlot, labware => (
                    <Labware
                      key={labware._id}
                      x={
                        slot.position[0] +
                        (labware.position ? labware.position[0] : 0)
                      }
                      y={
                        slot.position[1] +
                        (labware.position ? labware.position[1] : 0)
                      }
                      labware={labware}
                    />
                  ))}
              </Fragment>
            )
          })
        }
      </RobotWorkSpace>
    )
  }
}
