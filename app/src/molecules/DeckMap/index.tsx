import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import some from 'lodash/some'
import map from 'lodash/map'
import mapValues from 'lodash/mapValues'

import { RobotWorkSpace, ModuleItem } from '@opentrons/components'
import { getDeckDefinitions } from '@opentrons/components/src/hardware-sim/Deck/getDeckDefinitions'

import { selectors as robotSelectors } from '../../redux/robot'

import type { DeckSlot, DeckSlotId } from '@opentrons/shared-data'
import type { RouteComponentProps } from 'react-router-dom'
import type { State } from '../../redux/types'
import type { Labware, SessionModule, Slot } from '../../redux/robot'

import { getMatchedModules } from '../../redux/modules'

import { LabwareItem } from './LabwareItem'

export * from './LabwareItem'

interface OP extends RouteComponentProps<{ slot?: string }> {
  modulesRequired?: boolean
  enableLabwareSelection?: boolean
  className?: string
}

interface SP {
  labwareBySlot?: { [slot: string]: Labware[] | undefined }
  modulesBySlot?: { [slot: string]: DisplayModule | undefined }
  selectedSlot?: DeckSlotId | null
  areTipracksConfirmed?: boolean
}

type ModuleDisplayMode = React.ComponentProps<typeof ModuleItem>['mode']

interface DisplayModule extends SessionModule {
  mode?: React.ComponentProps<typeof ModuleItem>['mode']
  usbInfoString?: string
}

interface Props extends OP, SP {}

const deckSetupLayerBlocklist = [
  'calibrationMarkings',
  'fixedBase',
  'doorStops',
  'metalFrame',
  'removalHandle',
  'removableDeckOutline',
  'screwHoles',
]

function DeckMapComponent(props: Props): JSX.Element {
  const deckDef = React.useMemo(() => getDeckDefinitions().ot2_standard, [])
  const {
    modulesBySlot,
    labwareBySlot,
    selectedSlot,
    areTipracksConfirmed,
    className,
  } = props
  return (
    <RobotWorkSpace
      deckLayerBlocklist={deckSetupLayerBlocklist}
      deckDef={deckDef}
      viewBox={`-46 -10 ${488} ${390}`} // TODO: put these in variables
      className={className}
    >
      {({ deckSlotsById }) =>
        map<DeckSlot>(deckSlotsById, (slot: DeckSlot, slotId: string) => {
          if (!slot.matingSurfaceUnitVector) return null // if slot has no mating surface, don't render anything in it
          const moduleInSlot = modulesBySlot && modulesBySlot[slotId]
          const allLabwareInSlot = labwareBySlot && labwareBySlot[slotId]

          return (
            <React.Fragment key={slotId}>
              {moduleInSlot && (
                <g
                  transform={`translate(${slot.position[0]}, ${slot.position[1]})`}
                >
                  <ModuleItem
                    model={moduleInSlot.model}
                    mode={moduleInSlot.mode || 'default'}
                    slot={slot}
                    usbInfoString={moduleInSlot.usbInfoString}
                  />
                </g>
              )}
              {some(allLabwareInSlot) &&
                map(allLabwareInSlot, labware => (
                  <LabwareItem
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
                    areTipracksConfirmed={areTipracksConfirmed}
                    highlighted={selectedSlot ? slotId === selectedSlot : null}
                  />
                ))}
            </React.Fragment>
          )
        })
      }
    </RobotWorkSpace>
  )
}

function mapStateToProps(state: State, ownProps: OP): SP {
  let modulesBySlot: {
    [slot in Slot]?: DisplayModule
  } = mapValues(
    robotSelectors.getModulesBySlot(state),
    (module: SessionModule) => ({
      ...module,
      mode: 'default' as ModuleDisplayMode,
    })
  )

  // only show necessary modules if still need to connect some
  if (ownProps.modulesRequired === true) {
    const matchedModules = getMatchedModules(state)

    modulesBySlot = mapValues<DisplayModule | undefined>(
      robotSelectors.getModulesBySlot(state),
      (module: SessionModule) => {
        const matchedMod =
          matchedModules.find(mm => mm.slot === module.slot) ?? null
        const usbPort = matchedMod?.module?.usbPort
        const usbInfo =
          usbPort?.hub && usbPort?.port
            ? `USB Port ${usbPort.hub} - Hub Port ${usbPort.port}`
            : usbPort?.port
            ? `USB Port ${usbPort.port}`
            : 'USB Info N/A'
        return {
          ...module,
          mode: (matchedMod !== null
            ? 'present'
            : 'missing') as ModuleDisplayMode,
          usbInfoString: usbInfo,
        }
      }
    )
    return {
      modulesBySlot,
    }
  } else {
    const allLabware = robotSelectors.getLabware(state)
    const labwareBySlot = allLabware.reduce<
      { [slot in Labware['slot']]?: Labware[] }
    >((slotMap, labware) => {
      const { slot } = labware
      const slotContents = slotMap[slot] ?? []

      slotMap[slot] = [...slotContents, labware]
      return slotMap
    }, {})

    if (ownProps.enableLabwareSelection !== true) {
      return {
        labwareBySlot,
        modulesBySlot,
      }
    } else {
      const selectedSlot: DeckSlotId | null | undefined =
        ownProps.match.params.slot
      return {
        labwareBySlot,
        modulesBySlot,
        selectedSlot,
        areTipracksConfirmed: robotSelectors.getTipracksConfirmed(state),
      }
    }
  }
}

export const DeckMap = withRouter(connect(mapStateToProps)(DeckMapComponent))
