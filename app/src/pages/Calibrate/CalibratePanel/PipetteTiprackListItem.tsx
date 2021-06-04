import * as React from 'react'
import { useSelector } from 'react-redux'

import {
  ListItem,
  useHoverTooltip,
  TOOLTIP_BOTTOM,
  Tooltip,
  Box,
  Text,
  FONT_WEIGHT_SEMIBOLD,
  FONT_SIZE_BODY_1,
  C_WHITE,
} from '@opentrons/components'
import styles from './styles.css'

import type { AttachedPipette } from '../../../redux/pipettes/types'
import type { BaseProtocolLabware } from '../../../redux/calibration/types'
import type { State } from '../../../redux/types'

import { TipLengthCalibrationData } from './TipLengthCalibrationData'
import { getLabwareDisplayName } from '@opentrons/shared-data'
import { getTipLengthForPipetteAndTiprack } from '../../../redux/calibration'

const MARGIN_LEFT_SIZE = '1.6rem'

export interface PipetteTiprackListItemProps extends BaseProtocolLabware {
  robotName: string | null
  pipette: AttachedPipette | null
  calibrateUrl: string | null
}

export function PipetteTiprackListItem(
  props: PipetteTiprackListItemProps
): JSX.Element {
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

  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_BOTTOM,
  })
  return (
    <ListItem key={name} url={calibrateUrl} activeClassName={styles.active}>
      <Box {...targetProps} marginLeft={MARGIN_LEFT_SIZE}>
        <Text fontWeight={FONT_WEIGHT_SEMIBOLD}>{displayName}</Text>
        <TipLengthCalibrationData
          calibrationData={tipLengthCalibration}
          // the definitionHash will only be absent if old labware
          // or robot version <= 3.19
          calDataAvailable={definitionHash != null}
        />
      </Box>
      <Tooltip {...tooltipProps}>
        <Text fontSize={FONT_SIZE_BODY_1} color={C_WHITE}>
          {name}
        </Text>
      </Tooltip>
    </ListItem>
  )
}
