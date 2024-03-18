import * as React from 'react'
import { useSelector } from 'react-redux'
import map from 'lodash/map'
import noop from 'lodash/noop'
import reduce from 'lodash/reduce'
import omitBy from 'lodash/omitBy'
import { Tooltip, useHoverTooltip } from '@opentrons/components'
import { selectors } from '../../labware-ingred/selectors'
import { IngredPill } from './IngredPill'
import { PDListItem } from '../lists'
import { swatchColors } from '../swatchColors'
import { formatVolume, formatPercentage } from './utils'
import { LocationLiquidState } from '@opentrons/step-generation'
import {
  SubstepIdentifier,
  SubstepWellData,
  WellIngredientVolumeData,
  WellIngredientNames,
} from '../../steplist/types'
import styles from './StepItem.module.css'

interface SubstepRowProps {
  volume: number | string | null | undefined
  source?: SubstepWellData
  dest?: SubstepWellData
  ingredNames: WellIngredientNames
  className?: string
  stepId: string
  substepIndex: number
  selectSubstep?: (substepIdentifier: SubstepIdentifier) => unknown
}

interface PillTooltipContentsProps {
  ingreds: WellIngredientVolumeData | LocationLiquidState
  ingredNames: WellIngredientNames
  well: string
}
export const PillTooltipContents = (
  props: PillTooltipContentsProps
): JSX.Element => {
  const liquidDisplayColors = useSelector(selectors.getLiquidDisplayColors)
  const totalLiquidVolume = reduce(
    props.ingreds,
    // @ts-expect-error(sa, 2021-6-20): TODO IMMEDIATELY, this could either be single channel OR multi channel volume data
    // we have to differentiate, because the structure of the interface is different
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
                  style={{
                    backgroundColor:
                      liquidDisplayColors[Number(groupId)] ??
                      swatchColors(groupId),
                  }}
                />
              </td>
              <td className={styles.ingred_name}>
                {props.ingredNames[groupId]}
              </td>
              {hasMultipleIngreds && (
                <td className={styles.ingred_percentage}>
                  {/* @ts-expect-error(sa, 2021-6-20): TODO IMMEDIATELY, this could either be single channel OR multi channel volume data */}
                  {formatPercentage(ingred.volume, totalLiquidVolume)}
                </td>
              )}
              <td className={styles.ingred_partial_volume}>
                {/* @ts-expect-error(sa, 2021-6-20): TODO IMMEDIATELY, this could either be single channel OR multi channel volume data */}
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

function SubstepRowComponent(props: SubstepRowProps): JSX.Element {
  const compactedSourcePreIngreds = props.source
    ? omitBy(
        props.source.preIngreds,
        // @ts-expect-error(sa, 2021-6-21): ingred.volume might be undefined
        ingred => typeof ingred.volume === 'number' && ingred.volume <= 0
      )
    : {}
  const compactedDestPreIngreds = props.dest
    ? omitBy(
        props.dest.preIngreds,
        // @ts-expect-error(sa, 2021-6-21): ingred.volume might be undefined
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

        <span
          className={styles.emphasized_cell}
          data-test="SubstepRow_aspirateWell"
        >
          {props.source && props.source.well}
        </span>
        <span className={styles.volume_cell} data-test="SubstepRow_volume">
          {`${formatVolume(props.volume)} μL`}
        </span>
        <span
          className={styles.emphasized_cell}
          data-test="SubstepRow_dispenseWell"
        >
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

export const SubstepRow = React.memo(SubstepRowComponent)
