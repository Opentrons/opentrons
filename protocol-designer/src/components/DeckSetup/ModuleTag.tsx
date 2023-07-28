import * as React from 'react'
import { useSelector } from 'react-redux'
import cx from 'classnames'
import { RobotCoordsForeignDiv, Text } from '@opentrons/components'
import {
  getModuleVizDims,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  HEATERSHAKER_MODULE_TYPE,
  ModuleType,
  ModuleOrientation,
} from '@opentrons/shared-data'
import {
  ModuleTemporalProperties,
  TemperatureModuleState,
  TEMPERATURE_AT_TARGET,
  TEMPERATURE_APPROACHING_TARGET,
  TEMPERATURE_DEACTIVATED,
} from '@opentrons/step-generation'
import { i18n } from '../../localization'
import { timelineFrameBeforeActiveItem } from '../../top-selectors/timelineFrames'
import { selectors as stepFormSelectors } from '../../step-forms'
import { STD_SLOT_X_DIM, STD_SLOT_Y_DIM } from '../../constants'
import * as uiSelectors from '../../ui/steps'
import { getLabwareOnModule } from '../../ui/modules/utils'
import { makeSpeedText, makeTemperatureText } from '../../utils'
import styles from './ModuleTag.css'

export interface ModuleTagProps {
  x: number
  y: number
  orientation: ModuleOrientation
  id: string
}

// eyeballed width/height to match designs
const STANDARD_TAG_HEIGHT = 50
const STANDARD_TAG_WIDTH = 65
// thermocycler has its slot farther right = more width, and it has more lines of content = more height
const THERMOCYCLER_TAG_HEIGHT = 70
const THERMOCYCLER_TAG_WIDTH = 75
// heater shaker has three statuses requiring more lines of content = more height
const HEATERSHAKER_TAG_HEIGHT = 85
const HEATERSHAKER_TAG_WIDTH = 80

function getTempStatus(temperatureModuleState: TemperatureModuleState): string {
  const { targetTemperature, status } = temperatureModuleState

  if (status === TEMPERATURE_DEACTIVATED || targetTemperature === null) {
    return i18n.t(`modules.status.deactivated`)
  }

  if (status === TEMPERATURE_AT_TARGET) {
    return `${targetTemperature} ${i18n.t('application.units.degrees')}`
  }

  if (status === TEMPERATURE_APPROACHING_TARGET) {
    return `Going to ${targetTemperature} ${i18n.t(
      'application.units.degrees'
    )}`
  }

  console.warn(`Temperature status ${status} is not implemented`)
  return ''
}

export const ModuleStatus = ({
  moduleState,
}: {
  moduleState: ModuleTemporalProperties['moduleState']
}): JSX.Element | null => {
  switch (moduleState.type) {
    case MAGNETIC_MODULE_TYPE:
      return (
        <div className={styles.module_status_line}>
          {i18n.t(
            `modules.status.${moduleState.engaged ? 'engaged' : 'disengaged'}`
          )}
        </div>
      )

    case TEMPERATURE_MODULE_TYPE:
      const tempStatus = getTempStatus(moduleState)
      return <div className={styles.module_status_line}>{tempStatus}</div>

    case THERMOCYCLER_MODULE_TYPE:
      let lidStatus = null
      switch (moduleState.lidOpen) {
        case true:
          lidStatus = i18n.t('modules.lid_open')
          break
        case false:
          lidStatus = i18n.t('modules.lid_closed')
          break
        default:
          lidStatus = i18n.t('modules.lid_undefined')
      }
      const lidText = `${i18n.t('modules.lid_label', { lidStatus })}:`

      return (
        <>
          <div className={cx(styles.module_status_line)}>
            <div>{lidText}</div>
            <div>{makeTemperatureText(moduleState.lidTargetTemp)}</div>
          </div>
          <div className={styles.module_status_line}>
            <div>{i18n.t('modules.block_label')}:</div>
            <div>{makeTemperatureText(moduleState.blockTargetTemp)}</div>
          </div>
          <div />
        </>
      )
    case HEATERSHAKER_MODULE_TYPE:
      let latchStatus = null
      switch (moduleState.latchOpen) {
        case true:
          latchStatus = i18n.t('modules.lid_open')
          break
        case false:
          latchStatus = i18n.t('modules.lid_closed')
          break
        default:
          latchStatus = i18n.t('modules.lid_undefined')
      }
      return (
        <>
          <div className={styles.module_status_line}>
            <Text paddingBottom="2px">{i18n.t('modules.heater_label')}:</Text>
            <Text>{makeTemperatureText(moduleState.targetTemp)}</Text>
          </div>
          <div className={styles.module_status_line}>
            <Text paddingBottom="2px">{i18n.t('modules.shaker_label')}:</Text>
            <Text>{makeSpeedText(moduleState.targetSpeed)}</Text>
          </div>
          <div className={styles.module_status_line}>
            <Text paddingBottom="2px"> {i18n.t('modules.labware_latch')}:</Text>
            <Text>{latchStatus}</Text>
          </div>
          <div />
        </>
      )
    default:
      console.warn(
        `ModuleStatus doesn't support module type ${moduleState.type}`
      )
      return null
  }
}
const ModuleTagComponent = (props: ModuleTagProps): JSX.Element | null => {
  const timelineFrame = useSelector(timelineFrameBeforeActiveItem)
  const moduleEntity = useSelector(stepFormSelectors.getModuleEntities)[
    props.id
  ]
  const moduleState:
    | ModuleTemporalProperties['moduleState']
    | null
    | undefined = timelineFrame?.robotState.modules[props.id]?.moduleState
  const moduleType: ModuleType | null | undefined = moduleEntity?.type

  const hoveredLabwares = useSelector(uiSelectors.getHoveredStepLabware)
  const initialDeck = useSelector(stepFormSelectors.getInitialDeckSetup)
  const moduleLabware = getLabwareOnModule(initialDeck, props.id)

  const isHoveredModuleStep =
    moduleLabware && hoveredLabwares.length
      ? hoveredLabwares[0] === moduleLabware.id
      : false

  if (moduleType == null || moduleState == null) {
    // this should never happen, but better to have an empty tag than to whitescreen
    console.error(
      `nullsy moduleType or moduleState for module "${props.id}" in the selected timeline frame`
    )
    return null
  }

  let tagHeight = STANDARD_TAG_HEIGHT
  let tagWidth = STANDARD_TAG_WIDTH

  if (moduleType === THERMOCYCLER_MODULE_TYPE) {
    tagHeight = THERMOCYCLER_TAG_HEIGHT
    tagWidth = THERMOCYCLER_TAG_WIDTH
  } else if (moduleType === HEATERSHAKER_MODULE_TYPE) {
    tagHeight = HEATERSHAKER_TAG_HEIGHT
    tagWidth = HEATERSHAKER_TAG_WIDTH
  }

  const { childXOffset, childYOffset } = getModuleVizDims(
    props.orientation,
    moduleType
  )
  return (
    <RobotCoordsForeignDiv
      x={
        props.x +
        (props.orientation === 'left'
          ? childXOffset - tagWidth
          : STD_SLOT_X_DIM + childXOffset)
      }
      y={props.y + childYOffset + (STD_SLOT_Y_DIM - tagHeight) / 2}
      height={tagHeight}
      width={tagWidth}
      innerDivProps={{
        'data-test': `ModuleTag_${moduleType}`,
        className: cx(styles.module_tag, {
          [styles.highlighted_border_right_none]:
            isHoveredModuleStep && props.orientation === 'left',
          [styles.highlighted_border_left_none]:
            isHoveredModuleStep && props.orientation === 'right',
        }),
      }}
    >
      <div className={styles.module_type}>
        {i18n.t(`modules.module_display_names.${moduleType}`)}
      </div>
      <div className={styles.module_status}>
        <ModuleStatus moduleState={moduleState} />
      </div>
    </RobotCoordsForeignDiv>
  )
}

export const ModuleTag = React.memo(ModuleTagComponent)
