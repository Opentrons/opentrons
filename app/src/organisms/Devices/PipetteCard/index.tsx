import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import { useSelector } from 'react-redux'

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
} from '@opentrons/components'
import {
  isOT3Pipette,
  NINETY_SIX_CHANNEL,
  SINGLE_MOUNT_PIPETTES,
} from '@opentrons/shared-data'
import { useCurrentSubsystemUpdateQuery } from '@opentrons/react-api-client'

import {
  LEFT,
  getAttachedPipetteSettingsFieldsById,
} from '../../../redux/pipettes'
import { OverflowBtn } from '../../../atoms/MenuList/OverflowBtn'
import { StyledText } from '../../../atoms/text'
import { Banner } from '../../../atoms/Banner'
import { useMenuHandleClickOutside } from '../../../atoms/MenuList/hooks'
import { InstrumentCard } from '../../../molecules/InstrumentCard'
import { ChangePipette } from '../../ChangePipette'
import { FLOWS } from '../../PipetteWizardFlows/constants'
import { PipetteWizardFlows } from '../../PipetteWizardFlows'
import { ChoosePipette } from '../../PipetteWizardFlows/ChoosePipette'
import { useIsOT3 } from '../hooks'
import { PipetteOverflowMenu } from './PipetteOverflowMenu'
import { PipetteSettingsSlideout } from './PipetteSettingsSlideout'
import { AboutPipetteSlideout } from './AboutPipetteSlideout'
import type { State } from '../../../redux/types'
import type { PipetteModelSpecs, PipetteName } from '@opentrons/shared-data'
import type { AttachedPipette, Mount } from '../../../redux/pipettes/types'
import type {
  PipetteWizardFlow,
  SelectablePipettes,
} from '../../PipetteWizardFlows/types'

interface PipetteCardProps {
  pipetteModelSpecs: PipetteModelSpecs | null
  pipetteId?: AttachedPipette['id'] | null
  isPipetteCalibrated: boolean
  mount: Mount
  robotName: string
  pipetteIs96Channel: boolean
  pipetteIsBad: boolean
  updatePipette: () => void
  isRunActive: boolean
}
const BANNER_LINK_STYLE = css`
  text-decoration: underline;
  cursor: pointer;
  margin-left: ${SPACING.spacing8};
`

const INSTRUMENT_CARD_STYLE = css`
  p {
    text-transform: lowercase;
  }

  p::first-letter {
    text-transform: uppercase;
  }
`

const SUBSYSTEM_UPDATE_POLL_MS = 5000

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
    updatePipette,
    isRunActive,
  } = props
  const {
    menuOverlay,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  } = useMenuHandleClickOutside()
  const isOt3 = useIsOT3(robotName)
  const pipetteName = pipetteModelSpecs?.name
  const isOT3PipetteAttached = isOT3Pipette(pipetteName as PipetteName)
  const pipetteDisplayName = pipetteModelSpecs?.displayName
  const pipetteOverflowWrapperRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => setShowOverflowMenu(false),
  })
  const [showChangePipette, setChangePipette] = React.useState(false)
  const [showSlideout, setShowSlideout] = React.useState(false)
  const [
    pipetteWizardFlow,
    setPipetteWizardFlow,
  ] = React.useState<PipetteWizardFlow | null>(null)
  const [showAttachPipette, setShowAttachPipette] = React.useState(false)
  const [showAboutSlideout, setShowAboutSlideout] = React.useState(false)
  const subsystem = mount === LEFT ? 'pipette_left' : 'pipette_right'
  const { data: subsystemUpdateData } = useCurrentSubsystemUpdateQuery(
    subsystem,
    {
      enabled: isOt3,
      refetchInterval: SUBSYSTEM_UPDATE_POLL_MS,
    }
  )
  const settings = useSelector((state: State) =>
    getAttachedPipetteSettingsFieldsById(state, robotName, pipetteId ?? '')
  )

  const [
    selectedPipette,
    setSelectedPipette,
  ] = React.useState<SelectablePipettes>(SINGLE_MOUNT_PIPETTES)

  const handleChangePipette = (): void => {
    if (isOT3PipetteAttached && isOt3) {
      setPipetteWizardFlow(FLOWS.DETACH)
    } else if (!isOT3PipetteAttached && isOt3) {
      setShowAttachPipette(true)
    } else {
      setChangePipette(true)
    }
  }
  const handleCalibrate = (): void => {
    if (isOT3PipetteAttached) setPipetteWizardFlow(FLOWS.CALIBRATE)
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
      backgroundColor={COLORS.fundamentalsBackground}
      borderRadius={BORDERS.radiusSoftCorners}
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
          <Box
            padding={`${SPACING.spacing16} ${SPACING.spacing8}`}
            width="100%"
          >
            <Flex flexDirection={DIRECTION_ROW} paddingRight={SPACING.spacing8}>
              <Flex alignItems={ALIGN_START}>
                {pipetteModelSpecs !== null ? (
                  <InstrumentDiagram
                    pipetteSpecs={pipetteModelSpecs}
                    mount={mount}
                    //  pipette images for Flex are slightly smaller so need to be scaled accordingly
                    transform={isOt3 ? 'scale(0.4)' : 'scale(0.3)'}
                    size="3.125rem"
                    transformOrigin={isOt3 ? '-50% -10%' : '20% -10%'}
                  />
                ) : null}
              </Flex>
              <Flex
                flexDirection={DIRECTION_COLUMN}
                flex="100%"
                paddingLeft={SPACING.spacing8}
              >
                {isOT3PipetteAttached && !isPipetteCalibrated ? (
                  <Banner type="error" marginBottom={SPACING.spacing4}>
                    <Trans
                      t={t}
                      i18nKey="calibration_needed"
                      components={{
                        calLink: (
                          <StyledText
                            as="p"
                            css={css`
                              text-decoration: underline;
                              cursor: pointer;
                              margin-left: 0.5rem;
                            `}
                            onClick={handleCalibrate}
                          />
                        ),
                      }}
                    />
                  </Banner>
                ) : null}
                <StyledText
                  textTransform={TYPOGRAPHY.textTransformUppercase}
                  color={COLORS.darkGreyEnabled}
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
            <OverflowBtn aria-label="overflow" onClick={handleOverflowClick} />
          </Box>
        </>
      )}
      {(pipetteIsBad || subsystemUpdateData != null) && (
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
                    : 'firmware_update_available_now'
                }
                components={{
                  updateLink: (
                    <StyledText
                      as="p"
                      css={BANNER_LINK_STYLE}
                      onClick={updatePipette}
                    />
                  ),
                }}
              />
            </Banner>
          }
        />
      )}
      {showOverflowMenu && (
        <>
          <Box
            ref={pipetteOverflowWrapperRef}
            data-testid={`PipetteCard_overflow_menu_${String(
              pipetteDisplayName
            )}`}
            onClick={() => setShowOverflowMenu(false)}
          >
            <PipetteOverflowMenu
              pipetteSpecs={pipetteModelSpecs}
              mount={mount}
              handleChangePipette={handleChangePipette}
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
