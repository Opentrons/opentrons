// @flow
import * as React from 'react'
import {Pill} from '@opentrons/components'
import type {NamedIngred} from '../steplist/types'
import {swatchColors} from '../constants.js'

type Props = {
  ingreds: ?Array<NamedIngred>
}

function IngredPill (props: Props) {
  const {ingreds} = props
  const fallBackColor = 'gray' // TODO const?

  if (!ingreds) {
    return <span />
  }

  const color = (ingreds.length === 1)
    ? swatchColors(ingreds[0].id)
    : fallBackColor

  return <Pill color={color}>{
    ingreds.map(ingred => ingred.name).join(',')
  }</Pill>
}

export default IngredPill
