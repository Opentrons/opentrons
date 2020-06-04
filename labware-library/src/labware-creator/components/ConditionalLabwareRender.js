// @flow
import * as React from 'react'
import cloneDeep from 'lodash/cloneDeep'
import {
  LabwareRender,
  LabwareOutline,
  RobotCoordsForeignDiv,
  RobotWorkSpace,
} from '@opentrons/components'
import {
  SLOT_LENGTH_MM as DEFAULT_X_DIMENSION,
  SLOT_WIDTH_MM as DEFAULT_Y_DIMENSION,
} from '@opentrons/shared-data'
import { labwareFormSchema } from '../labwareFormSchema'
import { fieldsToLabware } from '../fieldsToLabware'
import type { LabwareFields, ProcessedLabwareFields } from '../fields'
import styles from './ConditionalLabwareRender.css'

type Props = {|
  values: LabwareFields,
|}

export const ConditionalLabwareRender = (props: Props): React.Node => {
  const definition = React.useMemo(() => {
    const values = cloneDeep(props.values)

    // Fill arbitrary values in to any missing fields that aren't needed for this render,
    // eg some required definition data like well volume, height, and bottom shape don't affect the render.
    values.footprintXDimension =
      values.footprintXDimension || `${DEFAULT_X_DIMENSION}`
    values.footprintYDimension =
      values.footprintYDimension || `${DEFAULT_Y_DIMENSION}`
    values.labwareZDimension = values.wellDepth || '100'
    values.wellDepth = values.wellDepth || '80'
    values.wellVolume = values.wellVolume || '50'
    values.wellBottomShape = values.wellBottomShape || 'flat'
    values.labwareType = values.labwareType || 'wellPlate'

    values.displayName = values.displayName || 'Some Labware'
    values.loadName = values.loadName || 'some_labware'
    values.brand = values.brand || 'somebrand'
    // A few other fields don't even go into the definition (eg "is row spacing uniform" etc).
    values.homogeneousWells = 'true'
    values.regularRowSpacing = 'true'
    values.regularColumnSpacing = 'true'
    values.pipetteName = 'whatever'

    let castValues: ?ProcessedLabwareFields = null
    try {
      castValues = labwareFormSchema.cast(values)
    } catch (error) {}

    if (castValues === null) {
      return null
    }

    let def = null
    if (castValues) {
      def = fieldsToLabware(castValues)
    } else {
      console.log('invalid, no def for conditional render')
    }
    return def
  }, [props.values])

  const xDim = definition
    ? definition.dimensions.xDimension
    : DEFAULT_X_DIMENSION
  const yDim = definition
    ? definition.dimensions.yDimension
    : DEFAULT_Y_DIMENSION

  return (
    <RobotWorkSpace viewBox={`0 0 ${xDim} ${yDim}`}>
      {() =>
        definition ? (
          <LabwareRender definition={definition} />
        ) : (
          <>
            <LabwareOutline />
            <RobotCoordsForeignDiv
              x={0}
              y={0}
              width={xDim}
              height={yDim}
              innerDivProps={{ className: styles.error_text_wrapper }}
            >
              <div className={styles.error_text}>
                Add missing info to see labware preview
              </div>
            </RobotCoordsForeignDiv>
          </>
        )
      }
    </RobotWorkSpace>
  )
}
