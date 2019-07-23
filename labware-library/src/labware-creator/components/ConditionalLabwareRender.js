// @flow
import * as React from 'react'
import cloneDeep from 'lodash/cloneDeep'
import { LabwareRender, RobotWorkSpace } from '@opentrons/components'
import { X_DIMENSION, Y_DIMENSION } from '../fields'
import labwareFormSchema from '../labwareFormSchema'
import fieldsToLabware from '../fieldsToLabware'
import type { LabwareFields, ProcessedLabwareFields } from '../fields'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

// TODO IMMEDIATELY this is copied from PD, make it a component library component??
function SingleLabware(props: {| definition: LabwareDefinition2 |}) {
  return (
    <RobotWorkSpace
      viewBox={`0 0 ${props.definition.dimensions.xDimension} ${
        props.definition.dimensions.yDimension
      }`}
    >
      {() => <LabwareRender {...props} />}
    </RobotWorkSpace>
  )
}

type ConditionalLabwareRenderProps = {|
  values: LabwareFields,
|}

const ConditionalLabwareRender = (props: ConditionalLabwareRenderProps) => {
  const definition = React.useMemo(() => {
    const values = cloneDeep(props.values)

    // Fill arbitrary values in to any missing fields that aren't needed for this render,
    // eg some required definition data like well volume, height, and bottom shape don't affect the render.
    values.footprintXDimension = values.footprintXDimension || `${X_DIMENSION}`
    values.footprintYDimension = values.footprintYDimension || `${Y_DIMENSION}`
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

  const errorComponent = 'Cannot render labware, invalid inputs' // TODO get SVG for no-definition
  return definition ? <SingleLabware definition={definition} /> : errorComponent
}

export default ConditionalLabwareRender
