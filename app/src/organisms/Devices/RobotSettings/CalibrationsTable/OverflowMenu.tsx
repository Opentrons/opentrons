import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

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

// import { Divider } from '../../../../atoms/structure'
import {
  INTENT_RECALIBRATE_PIPETTE_OFFSET,
  INTENT_TIP_LENGTH_OUTSIDE_PROTOCOL,
} from '../../../../organisms/CalibrationPanels'
import * as Config from '../../../../redux/config'
import { useTrackEvent } from '../../../../redux/analytics'
import { EVENT_CALIBRATION_DOWNLOADED } from '../../../../redux/calibration'
import {
  usePipetteOffsetCalibrations,
  useTipLengthCalibrations,
} from '../../hooks'
import { useCalibratePipetteOffset } from '../../../CalibratePipetteOffset/useCalibratePipetteOffset'

// import type { State } from '../../../../redux/types'
import type {
  PipetteOffsetCalibration,
  TipLengthCalibration,
} from '../../../../redux/calibration/types'
import type { Mount } from '../../../../redux/pipettes/types'

const CAL_BLOCK_MODAL_CLOSED: 'cal_block_modal_closed' =
  'cal_block_modal_closed'
const CAL_BLOCK_MODAL_OPEN_WITH_REDO_TLC: 'cal_block_modal_redo' =
  'cal_block_modal_redo'
const CAL_BLOCK_MODAL_OPEN_WITH_KEEP_TLC: 'cal_block_modal_keep' =
  'cal_block_modal_keep'

type CalBlockModalState =
  | typeof CAL_BLOCK_MODAL_CLOSED
  | typeof CAL_BLOCK_MODAL_OPEN_WITH_REDO_TLC
  | typeof CAL_BLOCK_MODAL_OPEN_WITH_KEEP_TLC

interface OverflowMenuProps {
  calType: 'pipetteOffset' | 'tipLength'
  robotName: string
  // pipetteOffsetCalibration?: PipetteOffsetCalibration
  // tipLengthCalibration?: TipLengthCalibration
  mount: Mount
}

export function OverflowMenu({
  calType,
  robotName,
  // pipetteOffsetCalibration,
  mount,
}: OverflowMenuProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const doTrackEvent = useTrackEvent()
  const [showOverflowMenu, setShowOverflowMenu] = React.useState<boolean>(false)
  const [
    startPipetteOffsetCalibration,
    PipetteOffsetCalibrationWizard,
  ] = useCalibratePipetteOffset(robotName, { mount })

  const pipetteOffsetCalibrations = usePipetteOffsetCalibrations(robotName)
  const tipLengthCalibrations = useTipLengthCalibrations(robotName)
  // const dispatch = useDispatch<Dispatch>()

  const configHasCalibrationBlock = useSelector(Config.getHasCalibrationBlock)
  const [
    calBlockModalState,
    setCalBlockModalState,
  ] = React.useState<CalBlockModalState>(CAL_BLOCK_MODAL_CLOSED)
  interface StartWizardOptions {
    keepTipLength: boolean
    hasBlockModalResponse?: boolean | null
  }
  const startPipetteOffsetPossibleTLC = (options: StartWizardOptions): void => {
    const { keepTipLength, hasBlockModalResponse } = options
    if (hasBlockModalResponse === null && configHasCalibrationBlock === null) {
      setCalBlockModalState(
        keepTipLength
          ? CAL_BLOCK_MODAL_OPEN_WITH_KEEP_TLC
          : CAL_BLOCK_MODAL_OPEN_WITH_REDO_TLC
      )
    } else {
      startPipetteOffsetCalibration({
        overrideParams: {
          hasCalibrationBlock: Boolean(
            configHasCalibrationBlock ?? hasBlockModalResponse
          ),
          shouldRecalibrateTipLength: !keepTipLength,
        },
        withIntent: keepTipLength
          ? INTENT_RECALIBRATE_PIPETTE_OFFSET
          : INTENT_TIP_LENGTH_OUTSIDE_PROTOCOL,
      })
      setCalBlockModalState(CAL_BLOCK_MODAL_CLOSED)
    }
  }

  const handleCalibration = (
    calType: 'pipetteOffset' | 'tipLength',
    e: React.MouseEvent
  ): void => {
    e.preventDefault()
    if (calType === 'pipetteOffset') {
      console.log('recalibrate pipetteOffset')
      if (pipetteOffsetCalibration != null) {
        startPipetteOffsetCalibration({
          withIntent: INTENT_RECALIBRATE_PIPETTE_OFFSET,
        })
      } else {
        startPipetteOffsetPossibleTLC({ keepTipLength: true })
      }
    } else {
      startPipetteOffsetPossibleTLC({ keepTipLength: false })
    }
    setShowOverflowMenu(!showOverflowMenu)
  }

  const handleDownload = (
    calType: 'pipetteOffset' | 'tipLength',
    e: React.MouseEvent
  ): void => {
    e.preventDefault()
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

  // TODO 5/6/2021 kj: This is scoped out from 5.1
  // const handleDeleteCalibrationData = (
  //   calType: 'pipetteOffset' | 'tipLength'
  // ): void => {
  //   // method del
  //   // endpoint calibration/pipette_offset
  //   // pipet_id and mount
  //   // endpoint calibration/tip_length
  //   // tiprack hash and pipette_id
  //   setShowOverflowMenu(!showOverflowMenu)
  // }

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
          <MenuItem onClick={e => handleCalibration(calType, e)}>
            {calType === 'pipetteOffset'
              ? t('overflow_menu_recalibrate_pipette')
              : t('overflow_menu_recalibrate_tip_and_pipette')}
          </MenuItem>
          <MenuItem onClick={e => handleDownload(calType, e)}>
            {t('overflow_menu_download_calibration_data')}
          </MenuItem>
          {/* TODO 5/6/2021 kj: This is scoped out from 5.1 */}
          {/* <Divider /> */}
          {/* <MenuItem onClick={() => handleDeleteCalibrationData(calType)}>
            {t('overflow_menu_delete_data')}
          </MenuItem> */}
        </Flex>
      ) : null}
    </Flex>
  )
}
