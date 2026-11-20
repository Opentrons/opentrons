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
  Z_INDEX,
} from '@opentrons/components'
import { SINGLE_MOUNT_PIPETTES } from '@opentrons/shared-data'

import { PipetteWizardFlows } from '/app/organisms/PipetteWizardFlows'
import { FLOWS } from '/app/organisms/PipetteWizardFlows/constants'
import { useIsEstopNotDisengaged } from '/app/resources/devices'
import { useAttachedPipettesFromInstrumentsQuery } from '/app/resources/instruments'

import type { MouseEvent, ReactNode } from 'react'
import type { Mount } from '@opentrons/components'
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
  pipetteName,
}: OverflowMenuProps): ReactNode {
  const { t } = useTranslation([
    'device_settings',
    'shared',
    'robot_calibration',
  ])

  const [showPipetteWizardFlows, setShowPipetteWizardFlows] =
    useState<boolean>(false)
  const [selectedPipette, setSelectedPipette] = useState<SelectablePipettes>(
    SINGLE_MOUNT_PIPETTES
  )

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

  const isEstopNotDisengaged = useIsEstopNotDisengaged(robotName)
  const ot3PipCal =
    useAttachedPipettesFromInstrumentsQuery()[mount]?.data?.calibratedOffset
      ?.last_modified ?? null

  const handleRecalibrate = (e: MouseEvent): void => {
    e.preventDefault()
    if (!isRobotBusy && calType === 'pipetteOffset' && pipetteName != null) {
      setShowPipetteWizardFlows(true)
    }
    setShowOverflowMenu(currentShowOverflowMenu => !currentShowOverflowMenu)
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN} position={POSITION_RELATIVE}>
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
          zIndex={Z_INDEX.MENUS}
          borderRadius={BORDERS.borderRadius8}
          boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
          position={POSITION_ABSOLUTE}
          backgroundColor={COLORS.white}
          top="2.3rem"
          right={0}
          flexDirection={DIRECTION_COLUMN}
        >
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
        </Flex>
      ) : null}
      {menuOverlay}
    </Flex>
  )
}
