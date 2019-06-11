// @flow
import * as React from 'react'
import cx from 'classnames'
import { Link } from 'react-router-dom'
import { SLOT_RENDER_HEIGHT, SLOT_RENDER_WIDTH } from '@opentrons/shared-data'

import {
  selectors as robotSelectors,
  actions as robotActions,
  type Labware,
  type SessionModule,
} from '../../robot'
import { getLatestLabwareDef, getLegacyLabwareDef } from '../../util'

import {
  LabwareNameOverlay,
  // ModuleNameOverlay,
  RobotCoordsForeignDiv,
  RobotCoordsText,
  LabwareRender,
  Labware as LabwareComponent,
  humanizeLabwareType,
  type LabwareComponentProps,
} from '@opentrons/components'

import LabwareSpinner from './LabwareSpinner'
import styles from './styles.css'

export type LabwareItemProps = {
  ...$Exact<LabwareComponentProps>,
  labware: {
    ...$Exact<Labware>,
    highlighted?: boolean,
    disabled?: boolean,
    showSpinner?: boolean,
    onClick?: () => void,
    url?: string,
  },
  module: ?SessionModule,
}

export default function LabwareItem(props: LabwareItemProps) {
  const {
    labware,
    x,
    y,
    highlighted,
    areTipracksConfirmed,
    handleClick,
  } = props

  const { isTiprack, confirmed, name, type, slot } = labware

  const showSpinner = highlighted && labware.calibration === 'moving-to-slot'
  const disabled =
    (isTiprack && confirmed) || (!isTiprack && !areTipracksConfirmed)

  const title = humanizeLabwareType(type)

  let item

  if (labware.isLegacy) {
    item = (
      <g className={cx({ [styles.disabled]: disabled })}>
        <LabwareComponent definition={getLegacyLabwareDef(type)} />
        {/*
        {showSpinner ? (
            <LabwareSpinner />
          ) : (
            <LabwareNameOverlay title={title} subtitle={name} />
          )
          // module && <ModuleNameOverlay name={module.name} />
        }
        */}
        {highlighted && (
          <rect
            className={styles.highlighted}
            x="0.5"
            y="0.5"
            width={SLOT_RENDER_WIDTH - 1}
            height={SLOT_RENDER_HEIGHT - 1}
            rx="6"
          />
        )}
      </g>
    )
  } else {
    const def = getLatestLabwareDef(type)
    item = (
      <>
        <g
          className={cx({ [styles.disabled]: disabled })}
          transform={`translate(${props.x}, ${props.y})`}
        >
          <LabwareRender definition={def} />
          <RobotCoordsForeignDiv
            width={def.dimensions.xDimension}
            height={def.dimensions.yDimension}
            x={0}
            y={0 - def.dimensions.yDimension}
            transformWithSVG
            innerDivProps={
              {
                //className: cx(styles.labware_controls, {
                //   [styles.highlighted_border_div]: highlighted,
                // }),
              }
            }
          >
            <div
              style={{
                height: '100px',
                width: '100px',
                backgroundColor: 'red',
              }}
            >
              NAME HERE
            </div>
          </RobotCoordsForeignDiv>
        </g>
      </>
    )
  }
  // const v2LabwareDef = getLabwareDefinition(loadName, namespace, version)
  if (!showSpinner && !disabled) {
    return (
      // <Link to={`/calibrate/labware/${slot}`} onClick={handleClick}>
      item
      // </Link>
    )
  }

  return item
}

function mapStateToProps(state: State, ownProps: OP): SP {
  return {
    _calibrator:
      ownProps.labware.calibratorMount ||
      robotSelectors.getCalibratorMount(state),
  }
}

function mergeProps(stateProps: SP, dispatchProps: DP, ownProps: OP): Props {
  const { labware } = ownProps
  const { dispatch } = dispatchProps
  const { _calibrator } = stateProps
  return {
    ...ownProps,
    handleClick: () => {
      if (_calibrator && (!labware.isTiprack || !labware.confirmed)) {
        dispatch(robotActions.moveTo(_calibrator, labware.slot))
      }
    },
  }
}
