// @flow
import * as React from 'react'
import {
  getLabware,
  getWellDefsForSVG,
  getIsTiprackDeprecated,
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
function getLabwareMetadata(labwareType: string) {
  const labwareDefinition = getLabware(labwareType)

  if (!labwareDefinition) {
    console.warn(
      `No labware type "${labwareType}" in labware definitions, cannot render labware`
    )
    return {}
  }

  const tipVolume =
    labwareDefinition.metadata && labwareDefinition.metadata.tipVolume
  return { tipVolume }
}

function createWell(
  wellName: string,
  labwareType: string,
  getTipProps?: $PropertyType<Props, 'getTipProps'>,
  getWellProps?: $PropertyType<Props, 'getWellProps'>
): React.Node {
  const { tipVolume } = getLabwareMetadata(labwareType)
  const isTiprack = getIsTiprackDeprecated(labwareType)
  const allWells = getWellDefsForSVG(labwareType)
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

// TODO: BC 2019-06-18 this is deprecated it should not be used anywhere
class Labware extends React.Component<Props> {
  render() {
    const { labwareType, getTipProps, getWellProps } = this.props

    if (!getLabware(labwareType)) {
      return <FallbackLabware />
    }

    const allWellNames = Object.keys(getWellDefsForSVG(labwareType))
    const isTiprack = getIsTiprackDeprecated(labwareType)
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
