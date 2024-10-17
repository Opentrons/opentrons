import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  ALIGN_START,
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  InstrumentDiagram,
  LegacyStyledText,
  OverflowBtn,
  SPACING,
  TYPOGRAPHY,
  useMenuHandleClickOutside,
  useOnClickOutside,
} from '@opentrons/components'
import { OT2_ROBOT_TYPE } from '@opentrons/shared-data'
import { usePipetteSettingsQuery } from '@opentrons/react-api-client'

import { LEFT } from '/app/redux/pipettes'
import { ChangePipette } from '../ChangePipette'
import { PipetteOverflowMenu } from './PipetteOverflowMenu'
import { PipetteSettingsSlideout } from './PipetteSettingsSlideout'
import { AboutPipetteSlideout } from './AboutPipetteSlideout'
import {
  DropTipWizardFlows,
  useDropTipWizardFlows,
} from '/app/organisms/DropTipWizardFlows'

import type { PipetteModelSpecs } from '@opentrons/shared-data'
import type { AttachedPipette, Mount } from '/app/redux/pipettes/types'

interface PipetteCardProps {
  pipetteModelSpecs: PipetteModelSpecs | null
  pipetteId?: AttachedPipette['id'] | null
  mount: Mount
  robotName: string
  isRunActive: boolean
  isEstopNotDisengaged: boolean
}

const POLL_DURATION_MS = 5000

// The OT-2 pipette card.
export const PipetteCard = (props: PipetteCardProps): JSX.Element => {
  const { t } = useTranslation(['device_details', 'protocol_setup'])
  const {
    pipetteModelSpecs,
    mount,
    robotName,
    pipetteId,
    isRunActive,
    isEstopNotDisengaged,
  } = props
  const {
    menuOverlay,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  } = useMenuHandleClickOutside()
  const pipetteDisplayName = pipetteModelSpecs?.displayName
  const pipetteOverflowWrapperRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => {
      setShowOverflowMenu(false)
    },
  })
  const [showChangePipette, setChangePipette] = useState(false)
  const [showSlideout, setShowSlideout] = useState(false)
  const [showAboutSlideout, setShowAboutSlideout] = useState(false)

  const { showDTWiz, disableDTWiz, enableDTWiz } = useDropTipWizardFlows()

  const settings =
    usePipetteSettingsQuery({
      refetchInterval: POLL_DURATION_MS,
      enabled: pipetteId != null,
    })?.data?.[pipetteId ?? '']?.fields ?? null

  const handleChangePipette = (): void => {
    setChangePipette(true)
  }
  const handleAboutSlideout = (): void => {
    setShowAboutSlideout(true)
  }
  const handleSettingsSlideout = (): void => {
    setShowSlideout(true)
  }
  return (
    <Flex
      backgroundColor={COLORS.grey10}
      borderRadius={BORDERS.borderRadius8}
      width="100%"
      data-testid={`PipetteCard_${String(pipetteDisplayName)}`}
    >
      {showChangePipette && (
        <ChangePipette
          robotName={robotName}
          mount={mount}
          closeModal={() => {
            setChangePipette(false)
          }}
        />
      )}
      {showDTWiz && pipetteModelSpecs != null ? (
        <DropTipWizardFlows
          robotType={OT2_ROBOT_TYPE}
          mount={mount}
          instrumentModelSpecs={pipetteModelSpecs}
          closeFlow={disableDTWiz}
          modalStyle="simple"
        />
      ) : null}
      {showSlideout &&
        pipetteModelSpecs != null &&
        pipetteId != null &&
        settings != null && (
          <PipetteSettingsSlideout
            robotName={robotName}
            pipetteName={pipetteModelSpecs.displayName}
            onCloseClick={() => {
              setShowSlideout(false)
            }}
            isExpanded={true}
            pipetteId={pipetteId}
            settings={settings}
          />
        )}
      {showAboutSlideout && pipetteModelSpecs != null && pipetteId != null && (
        <AboutPipetteSlideout
          pipetteId={pipetteId}
          pipetteName={pipetteModelSpecs.displayName}
          onCloseClick={() => {
            setShowAboutSlideout(false)
          }}
          isExpanded={true}
        />
      )}
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
                  transform="scale(0.3)"
                  transformOrigin="20% 52%"
                />
              </Flex>
            ) : null}
            <Flex flexDirection={DIRECTION_COLUMN} flex="100%">
              <LegacyStyledText
                textTransform={TYPOGRAPHY.textTransformUppercase}
                color={COLORS.grey60}
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                fontSize={TYPOGRAPHY.fontSizeH6}
                paddingBottom={SPACING.spacing4}
                data-testid={`PipetteCard_mount_${String(pipetteDisplayName)}`}
              >
                {t('mount', {
                  side: mount === LEFT ? t('left') : t('right'),
                })}
              </LegacyStyledText>
              <Flex
                paddingBottom={SPACING.spacing4}
                data-testid={`PipetteCard_display_name_${String(
                  pipetteDisplayName
                )}`}
              >
                <LegacyStyledText fontSize={TYPOGRAPHY.fontSizeP}>
                  {pipetteDisplayName ?? t('empty')}
                </LegacyStyledText>
              </Flex>
            </Flex>
          </Flex>
        </Box>
        <Box
          alignSelf={ALIGN_START}
          padding={SPACING.spacing4}
          data-testid={`PipetteCard_overflow_btn_${String(pipetteDisplayName)}`}
        >
          <OverflowBtn
            aria-label="overflow"
            onClick={handleOverflowClick}
            disabled={isEstopNotDisengaged}
          />
        </Box>
      </>
      {showOverflowMenu && (
        <>
          <Box
            ref={pipetteOverflowWrapperRef}
            onClick={() => {
              setShowOverflowMenu(false)
            }}
          >
            <PipetteOverflowMenu
              pipetteSpecs={pipetteModelSpecs}
              mount={mount}
              handleChangePipette={handleChangePipette}
              handleDropTip={enableDTWiz}
              handleSettingsSlideout={handleSettingsSlideout}
              handleAboutSlideout={handleAboutSlideout}
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
