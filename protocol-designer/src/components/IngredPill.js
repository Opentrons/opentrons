// @flow
import * as React from 'react'
import {Pill, MIXED_WELL_COLOR} from '@opentrons/components'
import type {NamedIngred} from '../steplist/types'
import {swatchColors} from '../constants.js'

type Props = {
  ingreds: ?Array<NamedIngred>
}

function IngredPill (props: Props) {
  const {ingreds} = props

  if (!ingreds || ingreds.length === 0) {
    // Invisible Pill, but has correct height/margin/etc for spacing
    return <Pill />
  }

  const color = (ingreds.length === 1)
    ? swatchColors(ingreds[0].id)
    : MIXED_WELL_COLOR

  return <Pill color={color}>{
    ingreds.map(ingred => ingred.name).join(',')
  }</Pill>
}

export default IngredPill
