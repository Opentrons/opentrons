// @flow
import * as React from 'react'
import {
  getLabwareV1Def,
  getWellPropsForSVGLabwareV1,
  getIsV1LabwareTiprack,
  type LabwareDefinition1,
} from '@opentrons/shared-data'

import LabwareOutline from './LabwareOutline'
import FallbackLabware from './FallbackLabware'
import Tip from './Tip'
import Well from './Well'
import styles from './Labware.css'

type WellProps = $Diff<
  React.ElementProps<typeof Well>,
  { wellDef: *, svgOffset: * }
>

type TipProps = $Diff<
  React.ElementProps<typeof Tip>,
  { wellDef: *, tipVolume: * }
>

export type Props = {
  /** labware type, to get definition from shared-data */
  labwareType: string,
  /** optional getter for tip props by wellName (tipracks only) */
  getTipProps?: (wellName: string) => ?TipProps,
  /** optional getter for well props by wellName (non-tiprack labware only ) */
  getWellProps?: (wellName: string) => ?WellProps,
}

// TODO: Ian 2018-06-27 this fn is called a zillion times, optimize it later
function getLabwareV1Metadata(def: LabwareDefinition1) {
  const tipVolume = def?.metadata?.tipVolume || null
  return { tipVolume }
}

function createWell(
  wellName: string,
  labwareType: string,
  getTipProps?: $PropertyType<Props, 'getTipProps'>,
  getWellProps?: $PropertyType<Props, 'getWellProps'>
): React.Node {
  const labwareDefinition = getLabwareV1Def(labwareType)
  if (!labwareDefinition) {
    console.warn(
      `No labware type "${labwareType}" in labware definitions, cannot render labware`
    )
    return null
  }

  const { tipVolume } = getLabwareV1Metadata(labwareDefinition)
  const isTiprack = getIsV1LabwareTiprack(labwareDefinition)
  const allWells = getWellPropsForSVGLabwareV1(labwareDefinition)
  const wellDef = allWells && allWells[wellName]

  if (!wellDef) {
    console.warn(
      `No well definition for labware ${labwareType}, well ${wellName}`
    )
    return null
  }

  // TODO: Ian 2018-06-27 remove scale & transform so this offset isn't needed
  // Or... this is actually from the labware definitions?? But not tipracks?
  const svgOffset = {
    x: 1,
    y: -3,
  }

  if (isTiprack) {
    const tipProps = (getTipProps && getTipProps(wellName)) || {}
    return (
      <Tip
        key={wellName}
        wellDef={wellDef}
        tipVolume={tipVolume}
        {...tipProps}
      />
    )
  }

  const wellProps = (getWellProps && getWellProps(wellName)) || {}
  return (
    <Well
      key={wellName}
      wellName={wellName}
      {...wellProps}
      {...{
        wellDef,
        svgOffset,
      }}
    />
  )
}

// TODO: BC 2018-10-10 this is a class component because it should probably have a sCU for performance reasons
class Labware extends React.Component<Props> {
  render() {
    const { labwareType, getTipProps, getWellProps } = this.props
    const labwareDef = getLabwareV1Def(labwareType)
    if (!labwareDef) {
      return <FallbackLabware />
    }

    const allWellNames = Object.keys(getWellPropsForSVGLabwareV1(labwareDef))
    const isTiprack = getIsV1LabwareTiprack(labwareDef)
    const wells = allWellNames.map(wellName =>
      createWell(wellName, labwareType, getTipProps, getWellProps)
    )

    return (
      <g>
        <LabwareOutline
          className={isTiprack ? styles.tiprack_plate_outline : null}
        />
        {wells}
      </g>
    )
  }
}

export default Labware
