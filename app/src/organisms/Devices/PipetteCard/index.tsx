import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  Box,
  Flex,
  DIRECTION_ROW,
  ALIGN_START,
  DIRECTION_COLUMN,
  SPACING,
  TYPOGRAPHY,
  COLORS,
  useOnClickOutside,
  InstrumentDiagram,
  BORDERS,
  ALIGN_CENTER,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  isFlexPipette,
  NINETY_SIX_CHANNEL,
  OT2_ROBOT_TYPE,
  SINGLE_MOUNT_PIPETTES,
} from '@opentrons/shared-data'
import {
  useCurrentSubsystemUpdateQuery,
  usePipetteSettingsQuery,
} from '@opentrons/react-api-client'

import { LEFT } from '../../../redux/pipettes'
import { OverflowBtn } from '../../../atoms/MenuList/OverflowBtn'
import { StyledText } from '../../../atoms/text'
import { Banner } from '../../../atoms/Banner'
import { useMenuHandleClickOutside } from '../../../atoms/MenuList/hooks'
import { InstrumentCard } from '../../../molecules/InstrumentCard'
import { ChangePipette } from '../../ChangePipette'
import { FLOWS } from '../../PipetteWizardFlows/constants'
import { PipetteWizardFlows } from '../../PipetteWizardFlows'
import { ChoosePipette } from '../../PipetteWizardFlows/ChoosePipette'
import { useIsFlex } from '../hooks'
import { PipetteOverflowMenu } from './PipetteOverflowMenu'
import { PipetteSettingsSlideout } from './PipetteSettingsSlideout'
import { AboutPipetteSlideout } from './AboutPipetteSlideout'

import type { PipetteModelSpecs, PipetteName } from '@opentrons/shared-data'
import type { AttachedPipette, Mount } from '../../../redux/pipettes/types'
import type {
  PipetteWizardFlow,
  SelectablePipettes,
} from '../../PipetteWizardFlows/types'
import { DropTipWizard } from '../../DropTipWizard'

interface PipetteCardProps {
  pipetteModelSpecs: PipetteModelSpecs | null
  pipetteId?: AttachedPipette['id'] | null
  isPipetteCalibrated: boolean
  mount: Mount
  robotName: string
  pipetteIs96Channel: boolean
  pipetteIsBad: boolean
  isRunActive: boolean
  isEstopNotDisengaged: boolean
}

const INSTRUMENT_CARD_STYLE = css`
  p {
    text-transform: lowercase;
  }

  p::first-letter {
    text-transform: uppercase;
  }
`

const POLL_DURATION_MS = 5000

export const PipetteCard = (props: PipetteCardProps): JSX.Element => {
  const { t, i18n } = useTranslation(['device_details', 'protocol_setup'])
  const {
    pipetteModelSpecs,
    isPipetteCalibrated,
    mount,
    robotName,
    pipetteId,
    pipetteIs96Channel,
    pipetteIsBad,
    isRunActive,
    isEstopNotDisengaged,
  } = props
  const {
    menuOverlay,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  } = useMenuHandleClickOutside()
  const isFlex = useIsFlex(robotName)
  const pipetteName = pipetteModelSpecs?.name
  const isFlexPipetteAttached = isFlexPipette(pipetteName as PipetteName)
  const pipetteDisplayName = pipetteModelSpecs?.displayName
  const pipetteOverflowWrapperRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => setShowOverflowMenu(false),
  })
  const [showChangePipette, setChangePipette] = React.useState(false)
  const [showDropTipWizard, setShowDropTipWizard] = React.useState(false)
  const [showSlideout, setShowSlideout] = React.useState(false)
  const [
    pipetteWizardFlow,
    setPipetteWizardFlow,
  ] = React.useState<PipetteWizardFlow | null>(null)
  const [showAttachPipette, setShowAttachPipette] = React.useState(false)
  const [showAboutSlideout, setShowAboutSlideout] = React.useState(false)
  const subsystem = mount === LEFT ? 'pipette_left' : 'pipette_right'
  const [pollForSubsystemUpdate, setPollForSubsystemUpdate] = React.useState(
    false
  )
  const { data: subsystemUpdateData } = useCurrentSubsystemUpdateQuery(
    subsystem,
    {
      enabled: pollForSubsystemUpdate,
      refetchInterval: POLL_DURATION_MS,
    }
  )
  // we should poll for a subsystem update from the time a bad instrument is
  // detected until the update has been done for 5 seconds
  // this gives the instruments endpoint time to start reporting
  // a good instrument
  React.useEffect(() => {
    if (pipetteIsBad && isFlex) {
      setPollForSubsystemUpdate(true)
    } else if (
      subsystemUpdateData != null &&
      subsystemUpdateData.data.updateStatus === 'done'
    ) {
      setTimeout(() => {
        setPollForSubsystemUpdate(false)
      }, POLL_DURATION_MS)
    }
  }, [pipetteIsBad, subsystemUpdateData, isFlex])

  const settings =
    usePipetteSettingsQuery({
      refetchInterval: POLL_DURATION_MS,
      enabled: pipetteId != null,
    })?.data?.[pipetteId ?? '']?.fields ?? null

  const [
    selectedPipette,
    setSelectedPipette,
  ] = React.useState<SelectablePipettes>(SINGLE_MOUNT_PIPETTES)

  const handleChangePipette = (): void => {
    if (isFlexPipetteAttached && isFlex) {
      setPipetteWizardFlow(FLOWS.DETACH)
    } else if (!isFlexPipetteAttached && isFlex) {
      setShowAttachPipette(true)
    } else {
      setChangePipette(true)
    }
  }
  const handleDropTip = (): void => {
    setShowDropTipWizard(true)
  }
  const handleCalibrate = (): void => {
    if (isFlexPipetteAttached) setPipetteWizardFlow(FLOWS.CALIBRATE)
  }
  const handleAboutSlideout = (): void => {
    setShowAboutSlideout(true)
  }
  const handleSettingsSlideout = (): void => {
    setShowSlideout(true)
  }

  const handleAttachPipette = (): void => {
    setShowAttachPipette(false)
    setPipetteWizardFlow(FLOWS.ATTACH)
  }
  return (
    <Flex
      backgroundColor={COLORS.grey10}
      borderRadius={BORDERS.borderRadiusSize2}
      width="100%"
      data-testid={`PipetteCard_${String(pipetteDisplayName)}`}
    >
      {showAttachPipette ? (
        <ChoosePipette
          proceed={handleAttachPipette}
          setSelectedPipette={setSelectedPipette}
          selectedPipette={selectedPipette}
          exit={() => setShowAttachPipette(false)}
          mount={mount}
        />
      ) : null}
      {pipetteWizardFlow != null ? (
        <PipetteWizardFlows
          flowType={pipetteWizardFlow}
          mount={mount}
          closeFlow={() => {
            setSelectedPipette(SINGLE_MOUNT_PIPETTES)
            setPipetteWizardFlow(null)
          }}
          selectedPipette={
            pipetteName === 'p1000_96' ? NINETY_SIX_CHANNEL : selectedPipette
          }
        />
      ) : null}
      {showChangePipette && (
        <ChangePipette
          robotName={robotName}
          mount={mount}
          closeModal={() => setChangePipette(false)}
        />
      )}
      {showDropTipWizard && pipetteModelSpecs != null ? (
        <DropTipWizard
          robotType={isFlex ? FLEX_ROBOT_TYPE : OT2_ROBOT_TYPE}
          mount={mount}
          instrumentModelSpecs={pipetteModelSpecs}
          closeFlow={() => setShowDropTipWizard(false)}
        />
      ) : null}
      {showSlideout &&
        pipetteModelSpecs != null &&
        pipetteId != null &&
        settings != null && (
          <PipetteSettingsSlideout
            robotName={robotName}
            pipetteName={pipetteModelSpecs.displayName}
            onCloseClick={() => setShowSlideout(false)}
            isExpanded={true}
            pipetteId={pipetteId}
            settings={settings}
          />
        )}
      {showAboutSlideout && pipetteModelSpecs != null && pipetteId != null && (
        <AboutPipetteSlideout
          pipetteId={pipetteId}
          pipetteName={pipetteModelSpecs.displayName}
          mount={mount}
          onCloseClick={() => setShowAboutSlideout(false)}
          isExpanded={true}
        />
      )}
      {!pipetteIsBad && subsystemUpdateData == null && (
        <>
          <Box padding={SPACING.spacing16} width="100%">
            <Flex flexDirection={DIRECTION_ROW} paddingRight={SPACING.spacing8}>
              {pipetteModelSpecs !== null ? (
                <Flex
                  alignItems={ALIGN_CENTER}
                  width="3.75rem"
                  height="3.375rem"
                  paddingRight={SPACING.spacing8}
                >
                  <InstrumentDiagram
                    pipetteSpecs={pipetteModelSpecs}
                    mount={mount}
                    //  pipette images for Flex are slightly smaller so need to be scaled accordingly
                    transform="scale(0.3)"
                    transformOrigin={isFlex ? '-5% 52%' : '20% 52%'}
                  />
                </Flex>
              ) : null}
              <Flex flexDirection={DIRECTION_COLUMN} flex="100%">
                {isFlexPipetteAttached && !isPipetteCalibrated ? (
                  <Banner type="error" marginBottom={SPACING.spacing4}>
                    {isEstopNotDisengaged ? (
                      <StyledText as="p">
                        {t('calibration_needed_without_link')}
                      </StyledText>
                    ) : (
                      <Trans
                        t={t}
                        i18nKey="calibration_needed"
                        components={{
                          calLink: (
                            <StyledText
                              as="p"
                              css={css`
                                text-decoration: ${TYPOGRAPHY.textDecorationUnderline};
                                cursor: pointer;
                                margin-left: ${SPACING.spacing8};
                              `}
                              onClick={handleCalibrate}
                            />
                          ),
                        }}
                      />
                    )}
                  </Banner>
                ) : null}
                <StyledText
                  textTransform={TYPOGRAPHY.textTransformUppercase}
                  color={COLORS.grey50}
                  fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                  fontSize={TYPOGRAPHY.fontSizeH6}
                  paddingBottom={SPACING.spacing4}
                  data-testid={`PipetteCard_mount_${String(
                    pipetteDisplayName
                  )}`}
                >
                  {pipetteIs96Channel
                    ? t('both_mounts')
                    : t('mount', {
                        side: mount === LEFT ? t('left') : t('right'),
                      })}
                </StyledText>
                <Flex
                  paddingBottom={SPACING.spacing4}
                  data-testid={`PipetteCard_display_name_${String(
                    pipetteDisplayName
                  )}`}
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
            padding={SPACING.spacing4}
            data-testid={`PipetteCard_overflow_btn_${String(
              pipetteDisplayName
            )}`}
          >
            <OverflowBtn
              aria-label="overflow"
              onClick={handleOverflowClick}
              disabled={isEstopNotDisengaged}
            />
          </Box>
        </>
      )}
      {(pipetteIsBad ||
        (subsystemUpdateData != null && pollForSubsystemUpdate)) && (
        <InstrumentCard
          label={i18n.format(t('mount', { side: mount }), 'capitalize')}
          css={INSTRUMENT_CARD_STYLE}
          description={t('instrument_attached')}
          banner={
            <Banner
              type={subsystemUpdateData != null ? 'warning' : 'error'}
              marginBottom={SPACING.spacing4}
            >
              <Trans
                t={t}
                i18nKey={
                  subsystemUpdateData != null
                    ? 'firmware_update_occurring'
                    : 'firmware_update_needed'
                }
              />
            </Banner>
          }
          isEstopNotDisengaged={isEstopNotDisengaged}
        />
      )}
      {showOverflowMenu && (
        <>
          <Box
            ref={pipetteOverflowWrapperRef}
            onClick={() => setShowOverflowMenu(false)}
          >
            <PipetteOverflowMenu
              pipetteSpecs={pipetteModelSpecs}
              mount={mount}
              handleChangePipette={handleChangePipette}
              handleDropTip={handleDropTip}
              handleSettingsSlideout={handleSettingsSlideout}
              handleAboutSlideout={handleAboutSlideout}
              handleCalibrate={handleCalibrate}
              isPipetteCalibrated={isPipetteCalibrated}
              pipetteSettings={settings}
              isRunActive={isRunActive}
            />
          </Box>
          {menuOverlay}
        </>
      )}
    </Flex>
  )
}
