import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { saveAs } from 'file-saver'
import { useSelector } from 'react-redux'

import {
  Flex,
  COLORS,
  POSITION_ABSOLUTE,
  DIRECTION_COLUMN,
  POSITION_RELATIVE,
  ALIGN_FLEX_END,
  Mount,
  useOnClickOutside,
  useConditionalConfirm,
} from '@opentrons/components'
import { isOT3Pipette, SINGLE_MOUNT_PIPETTES } from '@opentrons/shared-data'

import { OverflowBtn } from '../../../atoms/MenuList/OverflowBtn'
import { MenuItem } from '../../../atoms/MenuList/MenuItem'
import { Portal } from '../../../App/portal'
import { useMenuHandleClickOutside } from '../../../atoms/MenuList/hooks'
import {
  INTENT_RECALIBRATE_PIPETTE_OFFSET,
  INTENT_TIP_LENGTH_OUTSIDE_PROTOCOL,
} from '../../DeprecatedCalibrationPanels'
import * as Config from '../../../redux/config'
import { useTrackEvent } from '../../../redux/analytics'
import { EVENT_CALIBRATION_DOWNLOADED } from '../../../redux/calibration'
import {
  useDeckCalibrationData,
  usePipetteOffsetCalibrations,
  useRunStatuses,
  useTipLengthCalibrations,
} from '../../../organisms/Devices/hooks'
import { AskForCalibrationBlockModal } from '../../CalibrateTipLength/AskForCalibrationBlockModal'
import { PipetteWizardFlows } from '../../PipetteWizardFlows'
import { FLOWS } from '../../PipetteWizardFlows/constants'
import { useCalibratePipetteOffset } from '../../CalibratePipetteOffset/useCalibratePipetteOffset'
import { DeckCalibrationConfirmModal } from '../DeckCalibrationConfirmModal'

import type { PipetteName } from '@opentrons/shared-data'

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
  mount: Mount
  serialNumber: string | null
  updateRobotStatus: (isRobotBusy: boolean) => void
  pipetteName?: string | null
}

export function OverflowMenu({
  calType,
  robotName,
  mount,
  serialNumber,
  updateRobotStatus,
  pipetteName,
}: OverflowMenuProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])
  const doTrackEvent = useTrackEvent()
  const {
    menuOverlay,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  } = useMenuHandleClickOutside()
  const { isDeckCalibrated } = useDeckCalibrationData(robotName)

  const calsOverflowWrapperRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => setShowOverflowMenu(false),
  })
  const [
    startPipetteOffsetCalibration,
    PipetteOffsetCalibrationWizard,
  ] = useCalibratePipetteOffset(robotName, { mount })
  const pipetteOffsetCalibrations = usePipetteOffsetCalibrations(robotName)

  const tipLengthCalibrations = useTipLengthCalibrations(robotName)
  const configHasCalibrationBlock = useSelector(Config.getHasCalibrationBlock)
  const [
    calBlockModalState,
    setCalBlockModalState,
  ] = React.useState<CalBlockModalState>(CAL_BLOCK_MODAL_CLOSED)
  const { isRunRunning: isRunning } = useRunStatuses()
  const [
    showPipetteWizardFlows,
    setShowPipetteWizardFlows,
  ] = React.useState<boolean>(false)
  const isGen3Pipette = isOT3Pipette(pipetteName as PipetteName)
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

  const applicablePipetteOffsetCal = pipetteOffsetCalibrations?.find(
    p => p.mount === mount && p.pipette === serialNumber
  )

  const {
    showConfirmation: showConfirmStart,
    confirm: confirmStart,
    cancel: cancelStart,
  } = useConditionalConfirm(
    () => startPipetteOffsetPossibleTLC({ keepTipLength: true }),
    !isDeckCalibrated
  )

  const handleCalibration = (
    calType: 'pipetteOffset' | 'tipLength',
    e: React.MouseEvent
  ): void => {
    e.preventDefault()
    if (!isRunning) {
      if (calType === 'pipetteOffset' && pipetteName != null) {
        if (Boolean(isGen3Pipette)) {
          setShowPipetteWizardFlows(true)
        } else {
          if (applicablePipetteOffsetCal != null) {
            // recalibrate pipette offset
            startPipetteOffsetCalibration({
              withIntent: INTENT_RECALIBRATE_PIPETTE_OFFSET,
            })
          } else {
            // calibrate pipette offset with a wizard since not calibrated yet
            confirmStart()
          }
        }
      } else {
        startPipetteOffsetPossibleTLC({
          keepTipLength: false,
          hasBlockModalResponse: null,
        })
      }
    }
    setShowOverflowMenu(currentShowOverflowMenu => !currentShowOverflowMenu)
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
        new Blob([JSON.stringify(pipetteOffsetCalibrations)]),
        `opentrons-${robotName}-pipette-offset-calibration.json`
      )
    } else if (calType === 'tipLength') {
      saveAs(
        new Blob([JSON.stringify(tipLengthCalibrations)]),
        `opentrons-${robotName}-tip-length-calibration.json`
      )
    }
    setShowOverflowMenu(currentShowOverflowMenu => !currentShowOverflowMenu)
  }

  let disabledReason = null
  if (isRunning) {
    disabledReason = t('shared:disabled_protocol_is_running')
  }

  React.useEffect(() => {
    if (isRunning) {
      updateRobotStatus(true)
    }
  }, [isRunning, updateRobotStatus])

  // TODO 5/6/2021 kj: This is scoped out from 6.0
  // const handleDeleteCalibrationData = (
  //   calType: 'pipetteOffset' | 'tipLength'
  // ): void => {
  //   // method del
  //   // endpoint calibration/pipette_offset
  //   // params pipet_id and mount
  //   // endpoint calibration/tip_length
  //   // params tiprack_hash and pipette_id
  //   setShowOverflowMenu(currentShowOverflowMenu => !currentShowOverflowMenu)
  // }

  return (
    <Flex flexDirection={DIRECTION_COLUMN} position={POSITION_RELATIVE}>
      <OverflowBtn
        alignSelf={ALIGN_FLEX_END}
        aria-label="CalibrationOverflowMenu_button"
        onClick={handleOverflowClick}
      />
      {showConfirmStart && !isDeckCalibrated && (
        <Portal level="top">
          <DeckCalibrationConfirmModal
            confirm={confirmStart}
            cancel={cancelStart}
          />
        </Portal>
      )}
      {showPipetteWizardFlows ? (
        <PipetteWizardFlows
          flowType={FLOWS.CALIBRATE}
          mount={mount}
          closeFlow={() => setShowPipetteWizardFlows(false)}
          robotName={robotName}
          //  TODO(jr/12/1/22): only single mount pipettes can be calibrated here for now
          selectedPipette={SINGLE_MOUNT_PIPETTES}
        />
      ) : null}
      {showOverflowMenu ? (
        <Flex
          ref={calsOverflowWrapperRef}
          whiteSpace="nowrap"
          zIndex={10}
          borderRadius="4px 4px 0px 0px"
          boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
          position={POSITION_ABSOLUTE}
          backgroundColor={COLORS.white}
          top="2.3rem"
          right={0}
          flexDirection={DIRECTION_COLUMN}
        >
          {mount != null && (
            <MenuItem
              onClick={e => handleCalibration(calType, e)}
              disabled={disabledReason !== null}
            >
              {calType === 'pipetteOffset'
                ? applicablePipetteOffsetCal != null
                  ? t('recalibrate_pipette')
                  : t('calibrate_pipette')
                : t('recalibrate_tip_and_pipette')}
            </MenuItem>
          )}
          {!Boolean(isGen3Pipette) ? (
            <MenuItem onClick={e => handleDownload(calType, e)}>
              {t('download_calibration_data')}
            </MenuItem>
          ) : null}
          {/* TODO 5/6/2021 kj: This is scoped out from 6.0 */}
          {/* <Divider /> */}
          {/* <MenuItem onClick={() => handleDeleteCalibrationData(calType)}>
          {t('overflow_menu_delete_data')}
        </MenuItem> */}
        </Flex>
      ) : null}
      {PipetteOffsetCalibrationWizard}
      {calBlockModalState !== CAL_BLOCK_MODAL_CLOSED ? (
        <Portal level="top">
          <AskForCalibrationBlockModal
            onResponse={hasBlockModalResponse => {
              startPipetteOffsetPossibleTLC({
                hasBlockModalResponse,
                keepTipLength:
                  calBlockModalState === CAL_BLOCK_MODAL_OPEN_WITH_KEEP_TLC,
              })
            }}
            titleBarTitle={t('pipette_offset_calibration')}
            closePrompt={() => setCalBlockModalState(CAL_BLOCK_MODAL_CLOSED)}
          />
        </Portal>
      ) : null}
      {menuOverlay}
    </Flex>
  )
}
