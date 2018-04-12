// @flow
import * as React from 'react'
import {Pill} from '@opentrons/components'
import type {NamedIngred} from '../steplist/types'
import {swatchColors} from '../constants.js'

// TODO Ian 2018-04-12 is there a better place for FALLBACK_COLOR? complib?
// It's a string for a CSS color representing the color of mixed-ingred wells
const FALLBACK_COLOR = '#9b9b9b' // NOTE: matches `--c-med-gray` in colors.css in complib

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
    : FALLBACK_COLOR

  return <Pill color={color}>{
    ingreds.map(ingred => ingred.name).join(',')
  }</Pill>
}

export default IngredPill
