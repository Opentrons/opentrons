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
  const { labware, highlighted, areTipracksConfirmed, handleClick } = props

  const { isTiprack, confirmed, name, type, slot } = labware

  const showSpinner = highlighted && labware.calibration === 'moving-to-slot'
  const disabled =
    (isTiprack && confirmed) || (!isTiprack && areTipracksConfirmed === false)

  const title = humanizeLabwareType(type)

  let item
  let width
  let height

  if (labware.isLegacy) {
    item = <LabwareComponent definition={getLegacyLabwareDef(type)} />
    width = SLOT_RENDER_WIDTH
    height = SLOT_RENDER_HEIGHT
    // <g className={cx({ [styles.disabled]: disabled })}>
    //   <LabwareComponent definition={getLegacyLabwareDef(type)} />
    //   {/*
    //   {showSpinner ? (
    //       <LabwareSpinner />
    //     ) : (
    //       <LabwareNameOverlay title={title} subtitle={name} />
    //     )
    //     // module && <ModuleNameOverlay name={module.name} />
    //   }
    //   */}
    //   {highlighted && (
    //     <rect
    //       className={styles.highlighted}
    //       x="0.5"
    //       y="0.5"
    //       width={SLOT_RENDER_WIDTH - 1}
    //       height={SLOT_RENDER_HEIGHT - 1}
    //       rx="6"
    //     />
    //   )}
    // </g>
    // )
  } else {
    const def = getLatestLabwareDef(type)
    item = <LabwareRender definition={def} />
    width = def.dimensions.xDimension
    height = def.dimensions.yDimension
  }
  return (
    <>
      <g
        className={cx({ [styles.disabled]: disabled })}
        transform={`translate(${props.x}, ${props.y})`}
      >
        {item}
        <RobotCoordsForeignDiv
          width={width}
          height={height}
          x={0}
          y={0 - height}
          transformWithSVG
          innerDivProps={{
            className: cx(styles.labware_ui_wrapper, {
              [styles.highlighted_border_div]: highlighted,
            }),
          }}
        >
          <Link
            to={`/calibrate/labware/${slot}`}
            onClick={handleClick}
            className={styles.labware_ui_link}
          >
            {showSpinner ? (
              <LabwareSpinner />
            ) : (
              <div className={styles.name_overlay}>
                <p className={styles.display_name}> {title} </p>
              </div>
            )
            // module && <ModuleNameOverlay name={module.name} />
            }
          </Link>
        </RobotCoordsForeignDiv>
      </g>
    </>
  )
  // // const v2LabwareDef = getLabwareDefinition(loadName, namespace, version)
  // if (!showSpinner && !disabled) {
  //   return item
  // }

  // return item
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
