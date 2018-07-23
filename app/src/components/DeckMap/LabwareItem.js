// @flow
import * as React from 'react'
import cx from 'classnames'
import {Link} from 'react-router-dom'

import type {Labware, SessionModule} from '../../robot'
import type {LabwareComponentProps} from '@opentrons/components'

import {
  ContainerNameOverlay,
  LabwareContainer,
  Plate,
  humanizeLabwareType
} from '@opentrons/components'

import LabwareSpinner from './LabwareSpinner'
import ModuleNameOverlay from './ModuleNameOverlay'
import styles from './styles.css'

export type LabwareItemProps = LabwareComponentProps & {
  labware: Labware & {
    highlighted?: boolean,
    disabled?: boolean,
    showSpinner?: boolean,
    onClick?: () => void,
    url?: string
  },
  module: ?SessionModule,
}

export default function LabwareItem (props: LabwareItemProps) {
  const {width, height, labware, module} = props

  const {
    name,
    type,
    highlighted,
    disabled,
    showSpinner,
    onClick,
    url
  } = labware

  const plateClass = cx({[styles.disabled]: disabled})

  const item = (
    <LabwareContainer width={width} height={height} highlighted={highlighted}>
      <g className={plateClass}>
        <Plate containerType={type} />

        {!showSpinner && (
          <ContainerNameOverlay
            title={humanizeLabwareType(type)}
            subtitle={name}
          />
        )}

        {!showSpinner && module && (
          // TODO(mc, 2018-07-23): displayName?
          <ModuleNameOverlay name={module.name} width={width}/>
        )}

        {showSpinner && (
          <LabwareSpinner />
        )}
      </g>
    </LabwareContainer>
  )

  if (!showSpinner && !disabled && url) {
    return (
      <Link to={url} onClick={onClick}>
        {item}
      </Link>
    )
  }

  return item
}
