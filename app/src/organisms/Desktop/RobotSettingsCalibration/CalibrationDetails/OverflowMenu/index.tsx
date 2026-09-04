import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  ALIGN_FLEX_END,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  MenuItem,
  NO_WRAP,
  OverflowBtn,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  useMenuHandleClickOutside,
  useOnClickOutside,
} from '@opentrons/components'
import {
  useAllPipetteOffsetCalibrationsQuery,
  useAllTipLengthCalibrationsQuery,
  useDeleteCalibrationMutation,
} from '@opentrons/react-api-client'
import { isFlexPipette, SINGLE_MOUNT_PIPETTES } from '@opentrons/shared-data'

import { Divider } from '/app/atoms/structure'
import {
  isFileSaveCanceledError,
  saveFileWithPicker,
} from '/app/local-resources/files/saveFileWithPicker'
import { PipetteWizardFlows } from '/app/organisms/PipetteWizardFlows'
import { FLOWS } from '/app/organisms/PipetteWizardFlows/constants'
import {
  ANALYTICS_CALIBRATION_DATA_DOWNLOADED,
  useTrackEvent,
} from '/app/redux/analytics'
import { useIsEstopNotDisengaged } from '/app/resources/devices'
import { useAttachedPipettesFromInstrumentsQuery } from '/app/resources/instruments'

import { ConfirmDeleteCalibrationModal } from './ConfirmDeleteCalibrationModal'

import type { MouseEvent } from 'react'
import type { DeleteCalRequestParams } from '@opentrons/api-client'
import type { Mount } from '@opentrons/components'
import type { PipetteName } from '@opentrons/shared-data'
import type { SelectablePipettes } from '/app/organisms/PipetteWizardFlows/types'

interface OverflowMenuProps {
  calType: 'pipetteOffset' | 'tipLength'
  robotName: string
  isRobotBusy: boolean
  mount: Mount
  serialNumber: string | null
  pipetteName?: string | null
  tiprackDefURI?: string | null
}

export function OverflowMenu({
  calType,
  robotName,
  isRobotBusy,
  mount,
  serialNumber,
  pipetteName,
  tiprackDefURI = null,
}: OverflowMenuProps): JSX.Element {
  const { t } = useTranslation([
    'device_settings',
    'shared',
    'robot_calibration',
  ])

  const [showDeleteCalModal, setShowDeleteCalModal] = useState(false)
  const [showPipetteWizardFlows, setShowPipetteWizardFlows] =
    useState<boolean>(false)
  const [selectedPipette, setSelectedPipette] = useState<SelectablePipettes>(
    SINGLE_MOUNT_PIPETTES
  )

  const doTrackEvent = useTrackEvent()
  const {
    menuOverlay,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  } = useMenuHandleClickOutside()

  const calsOverflowWrapperRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => {
      setShowOverflowMenu(false)
    },
  })
  const pipetteOffsetCalibrations =
    useAllPipetteOffsetCalibrationsQuery().data?.data

  const tipLengthCalibrations = useAllTipLengthCalibrationsQuery().data?.data
  const isEstopNotDisengaged = useIsEstopNotDisengaged(robotName)
  const isPipetteForFlex = isFlexPipette(pipetteName as PipetteName)
  const ot3PipCal =
    useAttachedPipettesFromInstrumentsQuery()[mount]?.data?.calibratedOffset
      ?.last_modified ?? null

  const applicablePipetteOffsetCal = pipetteOffsetCalibrations?.find(
    p => p.mount === mount && p.pipette === serialNumber
  )
  const applicableTipLengthCal = tipLengthCalibrations?.find(
    cal => cal.pipette === serialNumber && cal.uri === tiprackDefURI
  )

  const calibrationPresent =
    calType === 'pipetteOffset'
      ? applicablePipetteOffsetCal != null
      : applicableTipLengthCal != null
  const handleRecalibrate = (e: MouseEvent): void => {
    e.preventDefault()
    if (
      !isRobotBusy &&
      isPipetteForFlex &&
      calType === 'pipetteOffset' &&
      pipetteName != null
    ) {
      setShowPipetteWizardFlows(true)
    }
    setShowOverflowMenu(currentShowOverflowMenu => !currentShowOverflowMenu)
  }

  const handleDownload = (e: MouseEvent): void => {
    e.preventDefault()
    doTrackEvent({
      name: ANALYTICS_CALIBRATION_DATA_DOWNLOADED,
      properties: {},
    })

    if (calType === 'pipetteOffset') {
      void saveFileWithPicker(
        `opentrons-${robotName}-pipette-offset-calibration.json`,
        new Blob([JSON.stringify(pipetteOffsetCalibrations)])
      ).catch((error: unknown) => {
        if (!isFileSaveCanceledError(error)) {
          throw error
        }
      })
    } else if (calType === 'tipLength') {
      void saveFileWithPicker(
        `opentrons-${robotName}-tip-length-calibration.json`,
        new Blob([JSON.stringify(tipLengthCalibrations)])
      ).catch((error: unknown) => {
        if (!isFileSaveCanceledError(error)) {
          throw error
        }
      })
    }
    setShowOverflowMenu(currentShowOverflowMenu => !currentShowOverflowMenu)
  }

  const { deleteCalibration } = useDeleteCalibrationMutation()

  const handleDeleteCalibration = (): void => {
    let params: DeleteCalRequestParams
    if (calType === 'pipetteOffset') {
      if (applicablePipetteOffsetCal == null) return
      params = {
        calType,
        mount,
        pipette_id: applicablePipetteOffsetCal.pipette,
      }
    } else {
      if (applicableTipLengthCal == null) return
      params = {
        calType,
        tiprack_uri: applicableTipLengthCal.uri,
        pipette_id: applicableTipLengthCal.pipette,
      }
    }

    deleteCalibration(params)
    setShowDeleteCalModal(false)
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN} position={POSITION_RELATIVE}>
      {showDeleteCalModal && (
        <ConfirmDeleteCalibrationModal
          onDelete={handleDeleteCalibration}
          toggleModal={() => {
            setShowDeleteCalModal(!showDeleteCalModal)
          }}
        />
      )}
      <OverflowBtn
        alignSelf={ALIGN_FLEX_END}
        aria-label={`CalibrationOverflowMenu_button_${calType}`}
        onClick={handleOverflowClick}
        disabled={isEstopNotDisengaged}
      />
      {showPipetteWizardFlows ? (
        <PipetteWizardFlows
          flowType={FLOWS.CALIBRATE}
          mount={mount}
          closeFlow={() => {
            setShowPipetteWizardFlows(false)
          }}
          selectedPipette={selectedPipette}
          onComplete={() => {
            setSelectedPipette(SINGLE_MOUNT_PIPETTES)
          }}
        />
      ) : null}
      {showOverflowMenu ? (
        <Flex
          ref={calsOverflowWrapperRef}
          whiteSpace={NO_WRAP}
          zIndex={10}
          borderRadius={BORDERS.borderRadius8}
          boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
          position={POSITION_ABSOLUTE}
          backgroundColor={COLORS.white}
          top="2.3rem"
          right={0}
          flexDirection={DIRECTION_COLUMN}
        >
          {isPipetteForFlex ? (
            <MenuItem
              onClick={handleRecalibrate}
              css={css`
                border-radius: ${BORDERS.borderRadius8};
              `}
              disabled={isRobotBusy}
              aria-label={`CalibrationOverflowMenu_button_calibrate`}
            >
              {t(
                ot3PipCal == null
                  ? 'robot_calibration:calibrate_pipette'
                  : 'robot_calibration:recalibrate_pipette'
              )}
            </MenuItem>
          ) : (
            <>
              <MenuItem
                onClick={handleDownload}
                disabled={!calibrationPresent}
                css={css`
                  border-radius: ${BORDERS.borderRadius8}
                    ${BORDERS.borderRadius8} 0 0;
                `}
              >
                {t('download_calibration_data')}
              </MenuItem>
              <Divider />
              <MenuItem
                onClick={() => {
                  setShowDeleteCalModal(true)
                  setShowOverflowMenu(
                    currentShowOverflowMenu => !currentShowOverflowMenu
                  )
                }}
                disabled={!calibrationPresent}
                css={css`
                  border-radius: 0 0 ${BORDERS.borderRadius8}
                    ${BORDERS.borderRadius8};
                `}
              >
                {t('robot_calibration:delete_calibration_data')}
              </MenuItem>
            </>
          )}
        </Flex>
      ) : null}
      {menuOverlay}
    </Flex>
  )
}
