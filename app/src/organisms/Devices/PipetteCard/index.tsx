import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { LEFT } from '../../../redux/pipettes'
import {
  Box,
  Flex,
  DIRECTION_ROW,
  ALIGN_START,
  DIRECTION_COLUMN,
  TEXT_TRANSFORM_UPPERCASE,
  SPACING,
  FONT_WEIGHT_REGULAR,
  FONT_SIZE_CAPTION,
  TYPOGRAPHY,
  COLORS,
  useOnClickOutside,
  InstrumentDiagram,
  BORDERS,
} from '@opentrons/components'
import { OverflowBtn } from '../../../atoms/MenuList/OverflowBtn'
import { Portal } from '../../../App/portal'
import { StyledText } from '../../../atoms/text'
import { getHasCalibrationBlock } from '../../../redux/config'
import { ChangePipette } from '../../ChangePipette'
import { useCalibratePipetteOffset } from '../../CalibratePipetteOffset/useCalibratePipetteOffset'
import {
  INTENT_CALIBRATE_PIPETTE_OFFSET,
  INTENT_RECALIBRATE_PIPETTE_OFFSET,
} from '../../CalibrationPanels'
import { AskForCalibrationBlockModal } from '../../CalibrateTipLength'
import { usePipetteOffsetCalibration } from '../hooks'
import { PipetteOverflowMenu } from './PipetteOverflowMenu'
import { PipetteSettingsSlideout } from './PipetteSettingsSlideout'
import { AboutPipetteSlideout } from './AboutPipetteSlideout'

import type { AttachedPipette, Mount } from '../../../redux/pipettes/types'
import type { PipetteModelSpecs } from '@opentrons/shared-data'

interface PipetteCardProps {
  pipetteInfo: PipetteModelSpecs | null
  pipetteId?: AttachedPipette['id']
  mount: Mount
  robotName: string
}

export const PipetteCard = (props: PipetteCardProps): JSX.Element => {
  const { t } = useTranslation('device_details')
  const [showOverflowMenu, setShowOverflowMenu] = React.useState(false)
  const { pipetteInfo, mount, robotName, pipetteId } = props
  const pipetteName = pipetteInfo?.displayName
  const pipetteOverflowWrapperRef = useOnClickOutside({
    onClickOutside: () => setShowOverflowMenu(false),
  }) as React.RefObject<HTMLDivElement>
  const [showChangePipette, setChangePipette] = React.useState(false)
  const [showSlideout, setShowSlideout] = React.useState(false)
  const [showAboutSlideout, setShowAboutSlideout] = React.useState(false)
  const [showCalBlockModal, setShowCalBlockModal] = React.useState(false)
  const configHasCalibrationBlock = useSelector(getHasCalibrationBlock)
  const [
    startPipetteOffsetCalibration,
    PipetteOffsetCalibrationWizard,
  ] = useCalibratePipetteOffset(robotName, { mount })
  const pipetteOffsetCalibration = usePipetteOffsetCalibration(
    robotName,
    pipetteId,
    mount
  )

  const startPipetteOffsetCalibrationBlockModal = (
    hasBlockModalResponse: boolean | null
  ): void => {
    if (hasBlockModalResponse === null && configHasCalibrationBlock === null) {
      setShowCalBlockModal(true)
    } else {
      startPipetteOffsetCalibration({
        overrideParams: {
          hasCalibrationBlock: Boolean(
            configHasCalibrationBlock ?? hasBlockModalResponse
          ),
        },
        withIntent: pipetteOffsetCalibration
          ? INTENT_RECALIBRATE_PIPETTE_OFFSET
          : INTENT_CALIBRATE_PIPETTE_OFFSET,
      })

      setShowCalBlockModal(false)
    }
  }

  const handleClick = (index: number): void => {
    if (index === 0) {
      setChangePipette(true)
    } else if (index === 1) {
      startPipetteOffsetCalibrationBlockModal(null)
    } else if (index === 2) {
      setShowAboutSlideout(true)
    } else if (index === 3) {
      setShowSlideout(true)
    }
  }

  return (
    <Flex
      backgroundColor={COLORS.background}
      borderRadius={BORDERS.radiusSoftCorners}
      marginBottom={SPACING.spacing3}
      marginX={SPACING.spacing2}
      width={'100%'}
      data-testid={`PipetteCard_${pipetteName}`}
    >
      {showChangePipette && (
        <ChangePipette
          robotName={robotName}
          mount={mount}
          closeModal={() => setChangePipette(false)}
        />
      )}
      {showSlideout && pipetteInfo != null && (
        <PipetteSettingsSlideout
          mount={mount}
          robotName={robotName}
          pipetteName={pipetteInfo.displayName}
          onCloseClick={() => setShowSlideout(false)}
          isExpanded={true}
        />
      )}
      {PipetteOffsetCalibrationWizard}

      {showAboutSlideout && pipetteInfo != null && pipetteId != null && (
        <AboutPipetteSlideout
          pipetteId={pipetteId}
          pipetteName={pipetteInfo.displayName}
          onCloseClick={() => setShowAboutSlideout(false)}
          isExpanded={true}
        />
      )}
      {showCalBlockModal && (
        <Portal level="top">
          <AskForCalibrationBlockModal
            onResponse={hasBlockModalResponse => {
              startPipetteOffsetCalibrationBlockModal(hasBlockModalResponse)
            }}
            titleBarTitle={t('pipette_offset_cal')}
            closePrompt={() => setShowCalBlockModal(false)}
          />
        </Portal>
      )}
      <Box padding={`${SPACING.spacing4} ${SPACING.spacing3}`} width="100%">
        <Flex flexDirection={DIRECTION_ROW} paddingRight={SPACING.spacing3}>
          <Flex alignItems={ALIGN_START}>
            {pipetteInfo === null ? null : (
              <InstrumentDiagram
                pipetteSpecs={pipetteInfo}
                mount={mount}
                transform="scale(0.3)"
                size="3.125rem"
                transformOrigin="20% -10%"
              />
            )}
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN} paddingLeft={SPACING.spacing3}>
            <StyledText
              textTransform={TEXT_TRANSFORM_UPPERCASE}
              color={COLORS.darkGrey}
              fontWeight={FONT_WEIGHT_REGULAR}
              fontSize={FONT_SIZE_CAPTION}
              paddingBottom={SPACING.spacing2}
              data-testid={`PipetteCard_mount_${pipetteName}`}
            >
              {t('mount', { side: mount === LEFT ? t('left') : t('right') })}
            </StyledText>
            <Flex
              paddingBottom={SPACING.spacing2}
              data-testid={`PipetteCard_display_name_${pipetteName}`}
            >
              <StyledText fontSize={TYPOGRAPHY.fontSizeP}>
                {pipetteName ?? t('empty')}
              </StyledText>
            </Flex>
          </Flex>
        </Flex>
      </Box>
      <Box
        alignSelf={ALIGN_START}
        padding={SPACING.spacing2}
        data-testid={`PipetteCard_overflow_btn_${pipetteName}`}
      >
        <OverflowBtn
          aria-label="overflow"
          onClick={() => {
            setShowOverflowMenu(prevShowOverflowMenu => !prevShowOverflowMenu)
          }}
        />
      </Box>
      {showOverflowMenu && (
        <div
          ref={pipetteOverflowWrapperRef}
          data-testid={`PipetteCard_overflow_menu_${pipetteName}`}
        >
          <PipetteOverflowMenu
            pipetteName={pipetteName ?? t('empty')}
            mount={mount}
            handleClick={handleClick}
            isPipetteCalibrated={pipetteOffsetCalibration != null}
          />
        </div>
      )}
    </Flex>
  )
}
