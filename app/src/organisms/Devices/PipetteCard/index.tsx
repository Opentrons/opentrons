import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import last from 'lodash/last'
import {
  Box,
  Flex,
  DIRECTION_ROW,
  ALIGN_START,
  DIRECTION_COLUMN,
  SPACING,
  useInterval,
  TYPOGRAPHY,
  COLORS,
  useOnClickOutside,
  InstrumentDiagram,
  BORDERS,
  Btn,
} from '@opentrons/components'
import { fetchPipettes, LEFT } from '../../../redux/pipettes'
import { OverflowBtn } from '../../../atoms/MenuList/OverflowBtn'
import { Portal } from '../../../App/portal'
import { StyledText } from '../../../atoms/text'
import { useMenuHandleClickOutside } from '../../../atoms/MenuList/hooks'
import { getHasCalibrationBlock } from '../../../redux/config'
import { getRequestById, useDispatchApiRequest } from '../../../redux/robot-api'
import { Banner } from '../../../atoms/Banner'
import {
  fetchCalibrationStatus,
  fetchPipetteOffsetCalibrations,
} from '../../../redux/calibration'
import { ChangePipette } from '../../ChangePipette'
import { useCalibratePipetteOffset } from '../../CalibratePipetteOffset/useCalibratePipetteOffset'
import {
  INTENT_CALIBRATE_PIPETTE_OFFSET,
  INTENT_RECALIBRATE_PIPETTE_OFFSET,
} from '../../DeprecatedCalibrationPanels'
import { FLOWS } from '../../PipetteWizardFlows/constants'
import { PipetteWizardFlows } from '../../PipetteWizardFlows'
import { AskForCalibrationBlockModal } from '../../CalibrateTipLength'
import { useDeckCalibrationData, usePipetteOffsetCalibration } from '../hooks'
import { PipetteOverflowMenu } from './PipetteOverflowMenu'
import { PipetteSettingsSlideout } from './PipetteSettingsSlideout'
import { AboutPipetteSlideout } from './AboutPipetteSlideout'

import type { AttachedPipette, Mount } from '../../../redux/pipettes/types'
import {
  isOT3Pipette,
  PipetteModelSpecs,
  PipetteMount,
  PipetteName,
} from '@opentrons/shared-data'
import type { Dispatch, State } from '../../../redux/types'
import type { PipetteWizardFlow } from '../../PipetteWizardFlows/types'

interface PipetteCardProps {
  pipetteInfo: PipetteModelSpecs | null
  pipetteId?: AttachedPipette['id'] | null
  mount: Mount
  robotName: string
}

const FETCH_PIPETTE_CAL_MS = 30000

export const PipetteCard = (props: PipetteCardProps): JSX.Element => {
  const { t } = useTranslation(['device_details', 'protocol_setup'])
  const { pipetteInfo, mount, robotName, pipetteId } = props
  const {
    menuOverlay,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  } = useMenuHandleClickOutside()
  const dispatch = useDispatch<Dispatch>()
  const [dispatchRequest, requestIds] = useDispatchApiRequest()
  const pipetteName = pipetteInfo?.name
  const pipetteDisplayName = pipetteInfo?.displayName
  const pipetteOverflowWrapperRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => setShowOverflowMenu(false),
  })
  const isOT3PipetteAttached = isOT3Pipette(pipetteName as PipetteName)
  const [showChangePipette, setChangePipette] = React.useState(false)
  const [showBanner, setShowBanner] = React.useState(true)
  const [showSlideout, setShowSlideout] = React.useState(false)
  const [showPipetteWizardFlows, setShowPipetteWizardFlows] = React.useState(
    false
  )
  const [showAboutSlideout, setShowAboutSlideout] = React.useState(false)
  const [showCalBlockModal, setShowCalBlockModal] = React.useState(false)
  const configHasCalibrationBlock = useSelector(getHasCalibrationBlock)
  const { isDeckCalibrated } = useDeckCalibrationData(robotName)
  const [
    startPipetteOffsetCalibration,
    PipetteOffsetCalibrationWizard,
  ] = useCalibratePipetteOffset(robotName, { mount })

  const pipetteOffsetCalibration = usePipetteOffsetCalibration(
    robotName,
    pipetteId,
    mount
  )
  const latestRequestId = last(requestIds)
  const isFetching = useSelector<State, boolean>(state =>
    latestRequestId != null
      ? getRequestById(state, latestRequestId)?.status === 'pending'
      : false
  )

  useInterval(
    () => {
      dispatch(fetchPipetteOffsetCalibrations(robotName))
    },
    pipetteOffsetCalibration === null ? 1000 : FETCH_PIPETTE_CAL_MS,
    true
  )

  React.useEffect(() => {
    dispatchRequest(fetchPipettes(robotName, true))
    dispatchRequest(fetchCalibrationStatus(robotName))
  }, [dispatchRequest, robotName])

  const badCalibration = pipetteOffsetCalibration?.status.markedBad

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

  const handleChangePipette = (): void => {
    setChangePipette(true)
  }
  const handleCalibrate = (): void => {
    isOT3PipetteAttached
      ? setShowPipetteWizardFlows(true)
      : startPipetteOffsetCalibrationBlockModal(null)
  }
  const handleAboutSlideout = (): void => {
    setShowAboutSlideout(true)
  }
  const handleSettingsSlideout = (): void => {
    setShowSlideout(true)
  }

  return (
    <Flex
      backgroundColor={COLORS.fundamentalsBackground}
      borderRadius={BORDERS.radiusSoftCorners}
      width="100%"
      data-testid={`PipetteCard_${pipetteDisplayName}`}
    >
      {showPipetteWizardFlows ? (
        <PipetteWizardFlows
          flowType={FLOWS.CALIBRATE as PipetteWizardFlow}
          mount={mount as PipetteMount}
          closeFlow={() => setShowPipetteWizardFlows(false)}
          robotName={robotName}
        />
      ) : null}
      {showChangePipette && (
        <ChangePipette
          robotName={robotName}
          mount={mount}
          closeModal={() => setChangePipette(false)}
        />
      )}
      {showSlideout && pipetteInfo != null && pipetteId != null && (
        <PipetteSettingsSlideout
          robotName={robotName}
          pipetteName={pipetteInfo.displayName}
          onCloseClick={() => setShowSlideout(false)}
          isExpanded={true}
          pipetteId={pipetteId}
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
            titleBarTitle={t('protocol_setup:pipette_offset_cal')}
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
          <Flex
            flexDirection={DIRECTION_COLUMN}
            flex="100%"
            paddingLeft={SPACING.spacing3}
          >
            {!isDeckCalibrated &&
            pipetteOffsetCalibration == null &&
            pipetteInfo != null &&
            showBanner &&
            !isFetching ? (
              <Flex paddingBottom={SPACING.spacing2}>
                <Banner
                  type="error"
                  flex="100%"
                  onCloseClick={() => setShowBanner(false)}
                >
                  {t('deck_cal_missing')}
                </Banner>
              </Flex>
            ) : null}
            {isDeckCalibrated &&
            pipetteOffsetCalibration == null &&
            pipetteInfo != null &&
            showBanner &&
            !isFetching &&
            !isOT3Pipette(pipetteName as PipetteName) ? (
              <Flex paddingBottom={SPACING.spacing2}>
                <Banner
                  type="error"
                  flex="100%"
                  onCloseClick={() => setShowBanner(false)}
                >
                  <Flex flexDirection={DIRECTION_COLUMN}>
                    {t('pipette_offset_calibration_needed')}
                    <Btn
                      textAlign={ALIGN_START}
                      fontSize={TYPOGRAPHY.fontSizeP}
                      textDecoration={TYPOGRAPHY.textDecorationUnderline}
                      onClick={handleCalibrate}
                    >
                      {t('calibrate_now')}
                    </Btn>
                  </Flex>
                </Banner>
              </Flex>
            ) : null}
            {isDeckCalibrated && badCalibration && showBanner ? (
              <Flex paddingBottom={SPACING.spacing2}>
                <Banner
                  type="warning"
                  flex="100%"
                  onCloseClick={() => setShowBanner(false)}
                >
                  <Flex flexDirection={DIRECTION_COLUMN}>
                    {t('pipette_cal_recommended')}
                    <Btn
                      textAlign={ALIGN_START}
                      fontSize={TYPOGRAPHY.fontSizeP}
                      textDecoration={TYPOGRAPHY.textDecorationUnderline}
                      onClick={handleCalibrate}
                    >
                      {t('recalibrate_now')}
                    </Btn>
                  </Flex>
                </Banner>
              </Flex>
            ) : null}
            <StyledText
              textTransform={TYPOGRAPHY.textTransformUppercase}
              color={COLORS.darkGreyEnabled}
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              fontSize={TYPOGRAPHY.fontSizeH6}
              paddingBottom={SPACING.spacing2}
              data-testid={`PipetteCard_mount_${pipetteDisplayName}`}
            >
              {t('mount', {
                side: mount === LEFT ? t('left') : t('right'),
              })}
            </StyledText>
            <Flex
              paddingBottom={SPACING.spacing2}
              data-testid={`PipetteCard_display_name_${pipetteDisplayName}`}
            >
              <StyledText fontSize={TYPOGRAPHY.fontSizeP}>
                {pipetteDisplayName ?? t('empty')}
              </StyledText>
            </Flex>
          </Flex>
        </Flex>
      </Box>
      <Box
        alignSelf={ALIGN_START}
        padding={SPACING.spacing2}
        data-testid={`PipetteCard_overflow_btn_${pipetteDisplayName}`}
      >
        <OverflowBtn aria-label="overflow" onClick={handleOverflowClick} />
      </Box>
      {showOverflowMenu && (
        <>
          <Box
            ref={pipetteOverflowWrapperRef}
            data-testid={`PipetteCard_overflow_menu_${pipetteDisplayName}`}
            onClick={() => setShowOverflowMenu(false)}
          >
            <PipetteOverflowMenu
              pipetteSpecs={pipetteInfo}
              mount={mount}
              handleChangePipette={handleChangePipette}
              handleCalibrate={handleCalibrate}
              handleSettingsSlideout={handleSettingsSlideout}
              handleAboutSlideout={handleAboutSlideout}
              isPipetteCalibrated={pipetteOffsetCalibration != null}
            />
          </Box>
          {menuOverlay}
        </>
      )}
    </Flex>
  )
}
