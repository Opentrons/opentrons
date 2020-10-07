// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'

import { ListItem, HoverTooltip, Box, Text, SPACING_4 } from '@opentrons/components'
import styles from './styles.css'

import type { AttachedPipette } from '../../pipettes/types'
import type { BaseProtocolLabware } from '../../calibration/types'
import type { State } from '../../types'

import { getLabwareDisplayName } from '@opentrons/shared-data'
import { getTipLengthForPipetteAndTiprack } from '../../calibration'

const MARGIN_LEFT_SIZE = '1.6rem'

export type PipetteTiprackListItemProps = {|
  robotName: string | null,
  pipette: AttachedPipette | null,
  calibrateUrl: string | null,
  tiprack: BaseProtocolLabware,
|}

export function PipetteTiprackListItem(
  props: PipetteTiprackListItemProps
): React.Node {
  const { robotName, pipette, calibrateUrl, tiprack } = props
  const definition = tiprack.definition
  const displayName = definition
    ? getLabwareDisplayName(definition)
    : tiprack.type
  const serialNumber = pipette ? pipette.id : null
  const tipLengthCalibration = useSelector((state: State) =>
    serialNumber && robotName && tiprack.definitionHash
      ? getTipLengthForPipetteAndTiprack(
          state,
          robotName,
          serialNumber,
          tiprack.definitionHash
        )
      : null
  )
  return (
    <HoverTooltip
      placement="bottom"
      tooltipComponent={
        <TiprackNameTooltip name={tiprack.name} displayName={displayName} />
      }
    >
      {tooltipHandlers => (
        <ListItem
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
