// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'

import { ListItem, HoverTooltip, Box, Text } from '@opentrons/components'
import styles from './styles.css'

import type { AttachedPipette } from '../../pipettes/types'
import type { BaseProtocolLabware } from '../../calibration/types'
import type { State } from '../../types'

import { getLabwareDisplayName } from '@opentrons/shared-data'
import { getTipLengthForPipetteAndTiprack } from '../../calibration'

const MARGIN_LEFT_SIZE = '1.6rem'

export type PipetteTiprackListItemProps = {|
  ...BaseProtocolLabware,
  robotName: string | null,
  pipette: AttachedPipette | null,
  calibrateUrl: string | null,
|}

export function PipetteTiprackListItem(
  props: PipetteTiprackListItemProps
): React.Node {
  const {
    name,
    definition,
    definitionHash,
    type,
    robotName,
    pipette,
    calibrateUrl,
  } = props
  const displayName = definition ? getLabwareDisplayName(definition) : type
  const serialNumber = pipette ? pipette.id : null
  const tipLengthCalibration = useSelector((state: State) =>
    serialNumber && robotName && definitionHash
      ? getTipLengthForPipetteAndTiprack(
          state,
          robotName,
          serialNumber,
          definitionHash
        )
      : null
  )
  return (
    <HoverTooltip
      placement="bottom"
      tooltipComponent={
        <TiprackNameTooltip name={name} displayName={displayName} />
      }
    >
      {tooltipHandlers => (
        <ListItem
          key={name}
          ref={tooltipHandlers?.ref}
          onMouseEnter={tooltipHandlers?.onMouseEnter}
          onMouseLeave={tooltipHandlers?.onMouseLeave}
          url={calibrateUrl}
          activeClassName={styles.active}
        >
          <Box marginLeft={MARGIN_LEFT_SIZE}>
            <Text>{displayName}</Text>
            {/* TODO: correctly render tip length calibraiton data */}
            {tipLengthCalibration
              ? tipLengthCalibration.tipLength
              : 'not yet calibrated'}
          </Box>
        </ListItem>
      )}
    </HoverTooltip>
  )
}

function TiprackNameTooltip(props: {| name: string, displayName: string |}) {
  const { name, displayName } = props

  return (
    <div className={styles.item_info_tooltip}>
      <p>{name}</p>
      <p>{displayName}</p>
    </div>
  )
}
