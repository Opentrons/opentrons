// @flow
import * as React from 'react'
import cx from 'classnames'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import { RobotCoordsText } from '../RobotCoordsText'
import styles from './WellLabels.css'

// magic layout numbers to make the letters close to the edges of the labware
const LETTER_COLUMN_X = 4
const NUMBER_COLUMN_Y_FROM_TOP = 5

export type WellLabelsProps = {|
  definition: LabwareDefinition2,
|}

const Labels = (props: {
  definition: LabwareDefinition2,
  wells: Array<string>,
  isLetterColumn?: boolean,
}) => (
  <>
    {props.wells.map(wellName => {
      const well = props.definition.wells[wellName]
      return (
        <RobotCoordsText
          key={wellName}
          x={props.isLetterColumn ? LETTER_COLUMN_X : well.x}
          y={
            props.isLetterColumn
              ? well.y
              : props.definition.dimensions.yDimension -
                NUMBER_COLUMN_Y_FROM_TOP
          }
          className={cx(styles.label_text, {
            [styles.letter_column]: props.isLetterColumn,
          })}
        >
          {(props.isLetterColumn ? /[A-Z]+/g : /\d+/g).exec(wellName)}
        </RobotCoordsText>
      )
    })}
  </>
)

function WellLabelsComponent(props: WellLabelsProps) {
  const { definition } = props
  const letterColumn = definition.ordering[0]
  const numberRow = definition.ordering.map(wellCol => wellCol[0])

  return (
    <g>
      <Labels definition={definition} wells={letterColumn} isLetterColumn />
      <Labels definition={definition} wells={numberRow} />
    </g>
  )
}

export const WellLabels: React.AbstractComponent<WellLabelsProps> = React.memo(
  WellLabelsComponent
)
