import * as React from 'react'
import { useSelector } from 'react-redux'
import noop from 'lodash/noop'
import omitBy from 'lodash/omitBy'
import { AIR } from '@opentrons/step-generation'
import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  DeckInfoLabel,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LiquidIcon,
  ListItem,
  SPACING,
} from '@opentrons/components'
import { selectors } from '../../../../labware-ingred/selectors'
import {
  MIXED_WELL_COLOR,
  swatchColors,
} from '../../../../components/swatchColors'
import { formatVolume } from './utils'
import type {
  SubstepIdentifier,
  SubstepWellData,
  WellIngredientNames,
} from '../../../../steplist'

interface SubstepRowProps {
  volume: number | string | null | undefined
  ingredNames: WellIngredientNames
  stepId: string
  substepIndex: number
  source?: SubstepWellData
  dest?: SubstepWellData
  selectSubstep?: (substepIdentifier: SubstepIdentifier) => void
}

function SubstepComponent(props: SubstepRowProps): JSX.Element {
  const {
    volume,
    ingredNames,
    stepId,
    substepIndex,
    source,
    dest,
    selectSubstep: propSelectSubstep,
  } = props
  const compactPreIngreds = (preIngreds: any) => {
    return omitBy(preIngreds, ingred => {
      return typeof ingred.volume === 'number' && ingred.volume <= 0
    })
  }
  const compactedSourcePreIngreds = props.source
    ? compactPreIngreds(props.source.preIngreds)
    : {}

  const selectSubstep = propSelectSubstep ?? noop

  const ingredIds: string[] = Object.keys(compactedSourcePreIngreds)
  const liquidDisplayColors = useSelector(selectors.getLiquidDisplayColors)
  const noColor = ingredIds.filter(id => id !== AIR).length === 0
  const color =
    ingredIds.length === 1
      ? liquidDisplayColors[Number(ingredIds[0])] ?? swatchColors(ingredIds[0])
      : noColor
      ? COLORS.transparent
      : MIXED_WELL_COLOR

  return (
    <ListItem
      type="noActive"
      onMouseEnter={() => {
        console.log('hello')
        selectSubstep({
          stepId,
          substepIndex,
        })
      }}
      onMouseLeave={() => {
        selectSubstep(null)
      }}
    >
      <Flex
        gridGap={SPACING.spacing4}
        padding={SPACING.spacing12}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        width="100%"
        alignItems={ALIGN_CENTER}
      >
        <LiquidIcon color={color} size="medium" />

        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
          {ingredIds.map(groupId => ingredNames[groupId]).join(',')}
        </Flex>
        {source != null ? <DeckInfoLabel deckLabel={source.well} /> : null}
        {`${formatVolume(volume)} μL`}
        {dest != null ? <DeckInfoLabel deckLabel={dest.well} /> : null}
      </Flex>
    </ListItem>
  )
}

export const Substep = React.memo(SubstepComponent)
