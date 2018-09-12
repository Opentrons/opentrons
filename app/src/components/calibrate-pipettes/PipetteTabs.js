// @flow
// instrument tabs bar container
// used for left/right pipette selection during pipette calibration
import * as React from 'react'

import type {Pipette} from '../../robot'
import {constants as robotConstants} from '../../robot'

import {PageTabs} from '@opentrons/components'

type Props = {
  pipettes: Array<Pipette>,
  currentPipette: ?Pipette,
}

export default function PipetteTabs (props: Props) {
  const {pipettes, currentPipette} = props

  const pages = robotConstants.PIPETTE_MOUNTS.map((mount) => ({
    title: mount,
    href: `./${mount}`,
    isActive: currentPipette != null && mount === currentPipette.mount,
    isDisabled: !pipettes.some((pipette) => pipette.mount === mount),
  }))

  return (
    <PageTabs pages={pages} />
  )
}
