import * as React from 'react'
import { RobotCoordsForeignDiv } from '@opentrons/components'
import {
  getModuleType,
  getModuleVizDims,
  LabwareOffset,
  ModuleModel,
  THERMOCYCLER_MODULE_TYPE,
  STD_SLOT_X_DIM,
  STD_SLOT_Y_DIM,
} from '@opentrons/shared-data'
import cx from 'classnames'
import { useTranslation } from 'react-i18next'
import styles from './styles.css'

export interface ModuleTagProps {
  x: number
  y: number
  orientation: 'left' | 'right'
  module: {
    model: ModuleModel
    labwareOffset: LabwareOffset
  }
}

// eyeballed width/height to match designs
const STANDARD_TAG_HEIGHT = 50
const STANDARD_TAG_WIDTH = 65
// thermocycler has its slot farther right = more width, and it has more lines of content = more height
const THERMOCYCLER_TAG_HEIGHT = 70
const THERMOCYCLER_TAG_WIDTH = 75

const getModuleGeneration = (model: ModuleModel): 'GEN1' | 'GEN2' => {
  switch (model) {
    case 'magneticModuleV1':
      return 'GEN1'
    case 'magneticModuleV2':
      return 'GEN2'
    case 'temperatureModuleV1':
      return 'GEN1'
    case 'temperatureModuleV2':
      return 'GEN2'
    case 'thermocyclerModuleV1':
      return 'GEN1'
    default:
      console.warn(`expected a module of type ModuleModel, got ${model}`)
      return 'GEN2'
  }
}

export const ModuleTag = (props: ModuleTagProps): JSX.Element => {
  const { x, y, orientation, module } = props
  const { t } = useTranslation('module_display_names')
  const moduleType = getModuleType(module.model)
  const { childXOffset, childYOffset } = getModuleVizDims(
    orientation,
    moduleType
  )
  let tagHeight = STANDARD_TAG_HEIGHT
  let tagWidth = STANDARD_TAG_WIDTH

  if (moduleType === THERMOCYCLER_MODULE_TYPE) {
    tagHeight = THERMOCYCLER_TAG_HEIGHT
    tagWidth = THERMOCYCLER_TAG_WIDTH
  }
  return (
    <RobotCoordsForeignDiv
      x={
        x +
        (orientation === 'left'
          ? childXOffset - tagWidth
          : STD_SLOT_X_DIM + childXOffset)
      }
      y={y + childYOffset + (STD_SLOT_Y_DIM - tagHeight) / 2}
      height={tagHeight}
      width={tagWidth}
      innerDivProps={{
        'data-test': `ModuleTag_${moduleType}`,
        className: cx(styles.module_tag),
      }}
    >
      <div>
        <p className={styles.module_info}> {t(moduleType)} </p>
        <p className={styles.module_info}>
          {getModuleGeneration(module.model)}{' '}
        </p>
      </div>
    </RobotCoordsForeignDiv>
  )
}
