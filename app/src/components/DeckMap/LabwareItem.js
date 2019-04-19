// @flow
import * as React from 'react'
import cx from 'classnames'
import { Link } from 'react-router-dom'

import type { Labware, SessionModule } from '../../robot'
import type { LabwareComponentProps } from '@opentrons/components'

import {
  ContainerNameOverlay,
  ModuleNameOverlay,
  LabwareContainer,
  Labware as LabwareComponent,
  humanizeLabwareType,
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
  const { width, height, labware, module } = props

  const {
    name,
    type,
    highlighted,
    disabled,
    showSpinner,
    onClick,
    url,
  } = labware

  const labwareClass = cx({ [styles.disabled]: disabled })

  const item = (
    <LabwareContainer width={width} height={height} highlighted={highlighted}>
      <g className={labwareClass}>
        <LabwareComponent labwareType={type} />

        {!showSpinner && (
          <ContainerNameOverlay
            title={humanizeLabwareType(type)}
            subtitle={name}
          />
        )}

        {!showSpinner && module && <ModuleNameOverlay name={module.name} />}

        {showSpinner && <LabwareSpinner />}
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
