// @flow
import * as React from 'react'
import map from 'lodash/map'
import noop from 'lodash/noop'
import reduce from 'lodash/reduce'
import omitBy from 'lodash/omitBy'
import { Tooltip, useHoverTooltip } from '@opentrons/components'
import { IngredPill } from './IngredPill'
import { PDListItem } from '../lists'
import { swatchColors } from '../swatchColors'
import { formatVolume, formatPercentage } from './utils'
import type { LocationLiquidState } from '../../step-generation'
import type {
  SubstepIdentifier,
  SubstepWellData,
  WellIngredientVolumeData,
  WellIngredientNames,
} from '../../steplist/types'
import styles from './StepItem.css'

type SubstepRowProps = {|
  volume?: ?number | ?string,
  source?: SubstepWellData,
  dest?: SubstepWellData,
  ingredNames: WellIngredientNames,
  className?: string,
  stepId: string,
  substepIndex: number,
  selectSubstep?: SubstepIdentifier => mixed,
|}

type PillTooltipContentsProps = {
  ingreds: WellIngredientVolumeData | LocationLiquidState,
  ingredNames: WellIngredientNames,
  well: string,
}
export const PillTooltipContents = (
  props: PillTooltipContentsProps
): React.Node => {
  const totalLiquidVolume = reduce(
    props.ingreds,
    (acc, ingred) => acc + ingred.volume,
    0
  )
  const hasMultipleIngreds = Object.keys(props.ingreds).length > 1
  return (
    <div className={styles.liquid_tooltip_contents}>
      <table>
        <tbody>
          {map(props.ingreds, (ingred, groupId) => (
            <tr key={groupId} className={styles.ingred_row}>
              <td>
                <div
                  className={styles.liquid_circle}
                  style={{ backgroundColor: swatchColors(Number(groupId)) }}
                />
              </td>
              <td className={styles.ingred_name}>
                {props.ingredNames[groupId]}
              </td>
              {hasMultipleIngreds && (
                <td className={styles.ingred_percentage}>
                  {formatPercentage(ingred.volume, totalLiquidVolume)}
                </td>
              )}
              <td className={styles.ingred_partial_volume}>
                {formatVolume(ingred.volume, 2)}µl
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {hasMultipleIngreds && (
        <React.Fragment>
          <div className={styles.total_divider} />
          <div className={styles.total_row}>
            <span>{`${props.well} Total Volume`}</span>
            <span>{formatVolume(totalLiquidVolume, 2)}µl</span>
          </div>
        </React.Fragment>
      )}
    </div>
  )
}

function SubstepRowComponent(props: SubstepRowProps) {
  const compactedSourcePreIngreds = props.source
    ? omitBy(
        props.source.preIngreds,
        ingred => typeof ingred.volume === 'number' && ingred.volume <= 0
      )
    : {}
  const compactedDestPreIngreds = props.dest
    ? omitBy(
        props.dest.preIngreds,
        ingred => typeof ingred.volume === 'number' && ingred.volume <= 0
      )
    : {}
  const selectSubstep = props.selectSubstep || noop

  const [sourceTargetProps, sourceTooltipProps] = useHoverTooltip({
    placement: 'bottom-start',
  })
  const [destTargetProps, destTooltipProps] = useHoverTooltip({
    placement: 'bottom-end',
  })
  return (
    <>
      <Tooltip {...sourceTooltipProps}>
        <PillTooltipContents
          well={props.source ? props.source.well : ''}
          ingredNames={props.ingredNames}
          ingreds={compactedSourcePreIngreds}
        />
      </Tooltip>

      <Tooltip {...destTooltipProps}>
        <PillTooltipContents
          well={props.dest ? props.dest.well : ''}
          ingredNames={props.ingredNames}
          ingreds={compactedDestPreIngreds}
        />
      </Tooltip>
      <PDListItem
        border
        className={props.className}
        onMouseEnter={() =>
          selectSubstep({
            stepId: props.stepId,
            substepIndex: props.substepIndex,
          })
        }
        onMouseLeave={() => selectSubstep(null)}
      >
        <IngredPill
          targetProps={sourceTargetProps}
          ingredNames={props.ingredNames}
          ingreds={compactedSourcePreIngreds}
        />

        <span className={styles.emphasized_cell}>
          {props.source && props.source.well}
        </span>
        <span className={styles.volume_cell}>{`${formatVolume(
          props.volume
        )} μL`}</span>
        <span className={styles.emphasized_cell}>
          {props.dest && props.dest.well}
        </span>

        <IngredPill
          targetProps={destTargetProps}
          ingredNames={props.ingredNames}
          ingreds={compactedDestPreIngreds}
        />
      </PDListItem>
    </>
  )
}

export const SubstepRow: React.AbstractComponent<SubstepRowProps> = React.memo(
  SubstepRowComponent
)
