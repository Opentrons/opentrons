import * as React from 'react'
import cx from 'classnames'
import styled from 'styled-components'
import parseHtml from 'html-react-parser'
import { stringify } from 'svgson'
import omitBy from 'lodash/omitBy'

import {
  getModuleDisplayName,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
  TEMPERATURE_MODULE_V1,
  TEMPERATURE_MODULE_V2,
  THERMOCYCLER_MODULE_V1,
  getModuleDef2
} from '@opentrons/shared-data'

import { Icon } from '../icons'
import { RobotCoordsForeignDiv } from './RobotCoordsForeignDiv'
import styles from './Module.css'

import type { IconName } from '../icons'
import type { ModuleModel, DeckSlot, ModuleDefinition, ModuleLayer } from '@opentrons/shared-data'
import { StyleProps } from '../primitives'
import { C_MED_LIGHT_GRAY } from '../styles'

const FLIPPED_SLOTS = ['3', '6', '9']
export interface ModuleProps {
  /** module model */
  model: ModuleModel
  /** display mode: 'default', 'present', 'missing', or 'info' */
  mode: 'default' | 'present' | 'missing' | 'info'
  /** slot details of the location of this module */
  slot: DeckSlot
  /** USB port detail of the connected module */
  usbInfoString?: string
}
const IDENTITY_MATRIX = [1,0,0,1,0,0]
export function Module(props: ModuleProps): JSX.Element {
  const { model, slot } = props

  const def = getModuleDef2(model)

  const {xDimension, yDimension} = def.dimensions
  const {x: xCornerOffset, y: yCornerOffset } = def.cornerOffsetFromSlot
  const slotTransform = def.slotTransforms?.ot2_standard?.[slot.id]?.labwareOffset

  console.log(slotTransform)
  const extraTransform = Boolean(slotTransform)
    ? [slotTransform[0][0], slotTransform[1][0], slotTransform[0][1], slotTransform[1][1], slotTransform[0][2], slotTransform[1][2], ] : IDENTITY_MATRIX
  return (
    <>
      <RobotCoordsForeignDiv
        width={xDimension}
        height={yDimension}
        x={xCornerOffset}
        y={yCornerOffset - yDimension}
        transformWithSVG
        extraTransform={`matrix(${extraTransform.join(',')})`}
        innerDivProps={{
          className: cx(styles.module),
        }}
      />
      <ModuleItemContents {...props} />
    </>
  )
}

function ModuleItemContents(props: ModuleProps): JSX.Element {
  const { mode, model, usbInfoString } = props
  const displayName = getModuleDisplayName(model)

  const iconClassName = cx(styles.module_review_icon, {
    [styles.module_review_icon_missing]: mode === 'missing',
    [styles.module_review_icon_present]: mode === 'present',
  })

  const iconNameByMode: Record<string, IconName> = {
    missing: 'alert-circle',
    present: 'check-circle',
    info: 'usb',
    default: 'usb',
  }

  return (
    <RobotCoordsForeignDiv innerDivProps={{className: styles.module_wrapper}} >
      {mode !== 'missing' && usbInfoString && (
        <p
          key="usbPortInfo"
          className={
            usbInfoString.includes('N/A')
              ? styles.module_port_text_na
              : styles.module_port_text
          }
        >
          {usbInfoString}
        </p>
      )}
      <p key="displayName" className={styles.module_review_text}>
        {displayName}
      </p>
      <div className={styles.module_connect_info_wrapper}>
        <Icon
          key="icon"
          className={iconClassName}
          x="8"
          y="0"
          svgWidth="12"
          name={iconNameByMode[mode] || 'usb'}
        />
        <p>{mode === 'missing' ? 'Not connected' : 'Connected'}</p>
      </div>
    </RobotCoordsForeignDiv>
  )
}


// TODO: BC 2021-08-03 we should migrate to only using the ModuleFromData
// component; once legacy Module viz is removed, we should rename it Module

export interface ModuleFromDataProps {
  def: ModuleDefinition
  layerBlocklist?: string[]
}

export function ModuleFromData(props: ModuleFromDataProps): JSX.Element {
  const { def, layerBlocklist = []} = props

  const layerGroupNodes = def.twoDimensionalRendering.children.filter(g => !layerBlocklist.includes(g.attributes?.id))

  console.log(layerGroupNodes)

  return (
    <g transform={`translate(${def.cornerOffsetFromSlot.x},${def.cornerOffsetFromSlot.y})`}>
      {parseHtml(stringify(layerGroupNodes, {selfClose: false}))}
    </g>
  )
}

export interface ThermocyclerVizProps {
  lidMotorState: 'open' | 'closed' | 'unknown'
}

export function ThermocyclerViz(props: ThermocyclerVizProps): JSX.Element {
  const { lidMotorState } = props
  const def = getModuleDef2(THERMOCYCLER_MODULE_V1)
  if (lidMotorState === 'unknown') { // just render a rectangle if we don't know the state of the lid
    return (
      <RobotCoordsForeignDiv
        width={def.dimensions.xDimension}
        height={def.dimensions.yDimension}
        x={def.cornerOffsetFromSlot.x}
        y={def.cornerOffsetFromSlot.y - def.dimensions.yDimension}
        transformWithSVG
        innerDivProps={{
          borderRadius: '6px',
          backgroundColor: C_MED_LIGHT_GRAY,
          width: '100%',
          height: '100%',
        }}
      />
    )
  }
  const layerBlocklist = def.twoDimensionalRendering.children.reduce((acc, g) => {
    const { id = '' } = g.attributes
    return id.startsWith(lidMotorState === 'open' ? 'closed' : 'open') ? [...acc, id] : acc
  }, [])
  return <ModuleFromData {...{def, layerBlocklist}}/>
}
