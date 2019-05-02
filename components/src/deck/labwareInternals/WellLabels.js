// @flow
import * as React from 'react'
import cx from 'classnames'
import RobotCoordsText from '../RobotCoordsText'
import styles from './wellLabels.css'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

// magic layout numbers to make the letters close to the edges of the labware
const LETTER_COLUMN_X = 4
const NUMBER_COLUMN_Y_FROM_TOP = 5

export type WellLabelsProps = {|
  definition: LabwareDefinition2,
|}

const makeLabels = (args: {
  definition: LabwareDefinition2,
  wells: Array<string>,
  isLetterColumn: boolean,
}) =>
  args.wells.map(wellName => {
    const well = args.definition.wells[wellName]
    return (
      <RobotCoordsText
        key={wellName}
        x={args.isLetterColumn ? LETTER_COLUMN_X : well.x}
        y={
          args.isLetterColumn
            ? well.y
            : args.definition.dimensions.overallWidth - NUMBER_COLUMN_Y_FROM_TOP
        }
        className={cx(styles.label_text, {
          [styles.letter_column]: args.isLetterColumn,
        })}
      >
        {(args.isLetterColumn ? /[A-Z]+/g : /\d+/g).exec(wellName)}
      </RobotCoordsText>
    )
  })

function WellLabels(props: WellLabelsProps) {
  const { definition } = props
  const letterColumn = definition.ordering[0]
  const numberRow = definition.ordering.map(wellCol => wellCol[0])

  return (
    <g>
      {makeLabels({
        definition,
        wells: letterColumn,
        isLetterColumn: true,
      })}
      {makeLabels({
        definition,
        wells: numberRow,
        isLetterColumn: false,
      })}
    </g>
  )
}

export default React.memo<WellLabelsProps>(WellLabels)
