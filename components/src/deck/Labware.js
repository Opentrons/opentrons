// @flow
import * as React from 'react'
import mapValues from 'lodash/mapValues'
import {getLabware, type LabwareDefinition, type WellDefinition} from '@opentrons/shared-data'
import {SLOT_HEIGHT} from './constants.js'

import LabwareOutline from './LabwareOutline'
import FallbackLabware from './FallbackLabware'
import Tip from './Tip'
import Well from './Well'
import styles from './Labware.css'

type WellProps = $Diff<React.ElementProps<typeof Well>,
  {wellDef: *, svgOffset: *}>

export type Props = {
  /** labware type, to get definition from shared-data */
  labwareType: string,
  /** optional getter for tip props by wellName (tipracks only) */
  getTipProps?: (wellName: string) => ?React.ElementProps<typeof Tip>,
  /** optional getter for well props by wellName (non-tiprack labware only ) */
  getWellProps?: (wellName: string) => ?WellProps
}

type LabwareData = {
  allWells: $PropertyType<LabwareDefinition, 'wells'>,
  allWellNames: Array<string>,
  isTiprack: boolean
}

function flipWellDefY (wellDef: WellDefinition): WellDefinition {
  // labware Y axis vs SVG Y axis is flipped, so we must mirror it
  return {
    ...wellDef,
    y: SLOT_HEIGHT - wellDef.y
  }
}

// TODO: Ian 2018-06-27 this fn is called a zillion times, optimize it later
function getLabwareData (labwareType: string): LabwareData {
  const labwareDefinition = getLabware(labwareType)

  if (!labwareDefinition) {
    console.warn(`No labware type "${labwareType}" in labware definitions, cannot render labware`)
    return {allWells: {}, allWellNames: [], isTiprack: false}
  }

  // labware Y vs SVG Y is flipped.
  const allWells = mapValues(labwareDefinition.wells, flipWellDefY)

  const isTiprack = Boolean(labwareDefinition.metadata && labwareDefinition.metadata.isTiprack)
  const allWellNames = Object.keys(allWells)

  return {allWells, allWellNames, isTiprack}
}

function createWell (
  wellName: string,
  labwareType: string,
  getTipProps?: $PropertyType<Props, 'getTipProps'>,
  getWellProps?: $PropertyType<Props, 'getWellProps'>
): React.Node {
  const {allWells, isTiprack} = getLabwareData(labwareType)
  const wellDef = allWells && allWells[wellName]

  if (!wellDef) {
    console.warn(`No well definition for labware ${labwareType}, well ${wellName}`)
    return null
  }

  // TODO: Ian 2018-06-27 remove scale & transform so this offset isn't needed
  // Or... this is actually from the labware definitions?? But not tipracks?
  const svgOffset = {
    x: 1,
    y: -3
  }

  if (isTiprack) {
    const tipProps = (getTipProps && getTipProps(wellName)) || {}
    return (
      <Tip
        key={wellName}
        wellDef={wellDef}
        {...tipProps}
      />
    )
  }

  const wellProps = (getWellProps && getWellProps(wellName)) || {}
  return <Well
    key={wellName}
    wellName={wellName}
    {...wellProps}
    {...{
      wellDef,
      svgOffset
    }}
  />
}

export default function Labware (props: Props) {
  const {labwareType, getTipProps, getWellProps} = props

  if (!(getLabware(labwareType))) {
    return <FallbackLabware />
  }

  const {allWellNames, isTiprack} = getLabwareData(labwareType)
  const wells = allWellNames.map(wellName => createWell(wellName, labwareType, getTipProps, getWellProps))

  return (
    <g>
      <LabwareOutline className={isTiprack ? styles.tiprack_plate_outline : null}/>
      {wells}
    </g>
  )
}
