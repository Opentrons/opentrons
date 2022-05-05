import * as React from 'react'
import { useTranslation } from 'react-i18next'
// import { useDispatch } from 'react-redux'

import {
  Flex,
  COLORS,
  POSITION_ABSOLUTE,
  DIRECTION_COLUMN,
  POSITION_RELATIVE,
  ALIGN_FLEX_END,
} from '@opentrons/components'
import { OverflowBtn } from '../../../../atoms/MenuList/OverflowBtn'
import { MenuItem } from '../../../../atoms/MenuList/MenuItem'
import { Divider } from '../../../../atoms/structure'
import { useTrackEvent } from '../../../../redux/analytics'
import { EVENT_CALIBRATION_DOWNLOADED } from '../../../../redux/calibration'
import {
  usePipetteOffsetCalibrations,
  useTipLengthCalibrations,
} from '../../hooks'

// import type { Dispatch } from '../../../../redux/types'

interface OverflowMenuProps {
  calType: 'pipetteOffset' | 'tipLength'
  robotName: string
}

// download use hooks as well

export function OverflowMenu({
  calType,
  robotName,
}: OverflowMenuProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const doTrackEvent = useTrackEvent()
  const [showOverflowMenu, setShowOverflowMenu] = React.useState<boolean>(false)

  const pipetteOffsetCalibrations = usePipetteOffsetCalibrations(robotName)
  const tipLengthCalibrations = useTipLengthCalibrations(robotName)
  // const dispatch = useDispatch<Dispatch>()

  const handleCalibration = (calType: 'pipetteOffset' | 'tipLength'): void => {
    if (calType === 'pipetteOffset') {
      // pipetteOffset Recalibrate pipette offset
    } else {
      // tipLength Recalibrate tip length and pipette offset
    }
    setShowOverflowMenu(!showOverflowMenu)
  }

  const handleDownload = (calType: 'pipetteOffset' | 'tipLength'): void => {
    // e.preventDefault()
    doTrackEvent({
      name: EVENT_CALIBRATION_DOWNLOADED,
      properties: {},
    })

    if (calType === 'pipetteOffset') {
      saveAs(
        new Blob([
          JSON.stringify({
            pipetteOffset: pipetteOffsetCalibrations,
          }),
        ]),
        `opentrons-${robotName}-pipette-offset-calibration.json`
      )
    } else if (calType === 'tipLength') {
      saveAs(
        new Blob([
          JSON.stringify({
            tipLength: tipLengthCalibrations,
          }),
        ]),
        `opentrons-${robotName}-tip-length-calibration.json`
      )
    }
    setShowOverflowMenu(!showOverflowMenu)
  }

  const handleOverflowClick: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    setShowOverflowMenu(!showOverflowMenu)
  }

  const handleDeleteCalibrationData = (
    calType: 'pipetteOffset' | 'tipLength'
  ): void => {
    // method del
    // endpoint calibration/pipette_offset
    // pipet_id and mount
    // endpoint calibration/tip_length
    // tiprack hash and pipette_id
    setShowOverflowMenu(!showOverflowMenu)
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN} position={POSITION_RELATIVE}>
      <OverflowBtn alignSelf={ALIGN_FLEX_END} onClick={handleOverflowClick} />
      {showOverflowMenu ? (
        <Flex
          width={calType === 'pipetteOffset' ? '11.25rem' : '17.25rem'}
          zIndex={10}
          borderRadius={'4px 4px 0px 0px'}
          boxShadow={'0px 1px 3px rgba(0, 0, 0, 0.2)'}
          position={POSITION_ABSOLUTE}
          backgroundColor={COLORS.white}
          top="3rem"
          right={0}
          flexDirection={DIRECTION_COLUMN}
        >
          <MenuItem onClick={() => handleCalibration(calType)}>
            {calType === 'pipetteOffset'
              ? t('overflow_menu_recalibrate_pipette')
              : t('overflow_menu_recalibrate_tip_and_pipette')}
          </MenuItem>
          <MenuItem onClick={() => handleDownload(calType)}>
            {t('overflow_menu_download_calibration_data')}
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => handleDeleteCalibrationData(calType)}>
            {t('overflow_menu_delete_data')}
          </MenuItem>
        </Flex>
      ) : null}
    </Flex>
  )
}
