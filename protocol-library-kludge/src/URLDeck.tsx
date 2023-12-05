import * as React from 'react'
import styles from './URLDeck.css'

import {
  RobotWorkSpace,
  LabwareNameOverlay,
  LabwareRender,
  ModuleItem,
  RobotCoordsForeignDiv,
} from '@opentrons/components'
import { getLatestLabwareDef } from './getLabware'
import { getDeckDefinitions } from '@opentrons/components/src/hardware-sim/Deck/getDeckDefinitions'
import type { ModuleModel, DeckSlotId } from '@opentrons/shared-data'

// URI-encoded JSON expected as URL param "data" (eg `?data=...`)

interface UrlData {
  labware: Record<
    DeckSlotId,
    {
      labwareType: string
      name: string | null | undefined
    }
  >
  modules: Record<DeckSlotId, ModuleModel>
}

const DECK_DEF = getDeckDefinitions().ot2_standard

const DECK_LAYER_BLOCKLIST = [
  'calibrationMarkings',
  'fixedBase',
  'doorStops',
  'metalFrame',
  'removalHandle',
  'removableDeckOutline',
  'screwHoles',
]

function getDataFromUrl(): UrlData | null {
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

export class URLDeck extends React.Component<{}> {
  urlData: UrlData | null

  constructor() {
    // @ts-expect-error(sa, 2021-7-8): call super with props
    super()
    this.urlData = getDataFromUrl()
  }

  render(): JSX.Element {
    const labwareBySlot = this.urlData?.labware
    const modulesBySlot = this.urlData?.modules

    return (
      <RobotWorkSpace
        deckDef={DECK_DEF}
        deckLayerBlocklist={DECK_LAYER_BLOCKLIST}
        viewBox={`-35 -35 ${488} ${390}`} // TODO: put these in variables
        margin="0 4rem"
      >
        {({ deckSlotsById }): Array<JSX.Element | null> =>
          Object.keys(deckSlotsById).map((slotId): JSX.Element | null => {
            const slot = deckSlotsById[slotId]
            if (!slot.matingSurfaceUnitVector) return null // if slot has no mating surface, don't render anything in it
            const moduleModel = modulesBySlot && modulesBySlot[slotId]
            const labware = labwareBySlot && labwareBySlot[slotId]
            const labwareDefV2 = labware && getLatestLabwareDef(labware.labwareType)
            let labwareDisplayType: string | null = null
            if (labwareDefV2) {
              labwareDisplayType = labwareDefV2.metadata.displayName
            } else {
              labwareDisplayType = labware?.labwareType || null
            }

            return (
              <React.Fragment key={slotId}>
                {moduleModel && (
                  <g
                    transform={`translate(${slot.position[0]}, ${slot.position[1]})`}
                  >
                    <ModuleItem
                      model={moduleModel}
                      mode={'default'}
                      slot={slot}
                    />
                  </g>
                )}
                {labware && (
                  <g
                    transform={`translate(${slot.position[0]}, ${slot.position[1]})`}
                  >
                    {labwareDefV2 ? (
                      <LabwareRender definition={labwareDefV2} />
                    ) : null}
                  </g>
                )}
                {labware && (
                  <RobotCoordsForeignDiv
                    x={slot.position[0]}
                    y={slot.position[1]}
                    width={slot.boundingBox.xDimension}
                    height={slot.boundingBox.yDimension}
                  >
                    <LabwareNameOverlay
                      className={styles.labware_name_overlay}
                      title={labware.name || labwareDisplayType || ''}
                      subtitle={labware.name ? labwareDisplayType : null}
                    />
                  </RobotCoordsForeignDiv>
                )}
              </React.Fragment>
            )
          })
        }
      </RobotWorkSpace>
    )
  }
}
