import { useEffect, useRef } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import {
  Banner,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  LegacyStyledText,
  SPACING,
} from '@opentrons/components'
import {
  NINETY_SIX_CHANNEL,
  RIGHT,
  SINGLE_MOUNT_PIPETTES,
  WEIGHT_OF_96_CHANNEL,
} from '@opentrons/shared-data'

import { isDocumentationProvided } from '/app/local-resources/access-control/utils'
import { usePipetteNameSpecs } from '/app/local-resources/instruments'
import { GenericWizardTile } from '/app/molecules/GenericWizardTile'
import {
  SimpleWizardBody,
  SimpleWizardInProgressBody,
} from '/app/molecules/SimpleWizardBody'
import { WizardRequiredEquipmentList } from '/app/molecules/WizardRequiredEquipmentList'

import {
  BODY_STYLE,
  CALIBRATION_PROBE,
  FLOWS,
  HEX_SCREWDRIVER,
  NINETY_SIX_CHANNEL_MOUNTING_PLATE,
  NINETY_SIX_CHANNEL_PIPETTE,
  PIPETTE,
} from './constants'
import { getIsGantryEmpty, isWasteChuteOnDeck } from './utils'

import type { AxiosError } from 'axios'
import type { UseMutateFunction, UseQueryResult } from 'react-query'
import type {
  CreateMaintenanceRunData,
  MaintenanceRun,
} from '@opentrons/api-client'
import type { DocumentationState } from '@opentrons/react-api-client'
import type {
  CreateCommand,
  DeckConfiguration,
  LoadedPipette,
} from '@opentrons/shared-data'
import type { PipetteWizardStepProps } from './types'

interface BeforeBeginningProps extends PipetteWizardStepProps {
  createMaintenanceRun: UseMutateFunction<
    MaintenanceRun,
    AxiosError<any>,
    CreateMaintenanceRunData,
    unknown
  >
  isCreateLoading: boolean
  createdMaintenanceRunId: string | null
  deckConfig: UseQueryResult<DeckConfiguration>
  requiredPipette?: LoadedPipette
  documentationState: DocumentationState
}
export const BeforeBeginning = (
  props: BeforeBeginningProps
): JSX.Element | null => {
  const {
    proceed,
    flowType,
    createMaintenanceRun,
    attachedPipettes,
    chainRunCommands,
    isCreateLoading,
    mount,
    isRobotMoving,
    errorMessage,
    setShowErrorMessage,
    selectedPipette,
    isOnDevice,
    requiredPipette,
    maintenanceRunId,
    createdMaintenanceRunId,
    deckConfig,
    documentationState,
  } = props
  const { t } = useTranslation(['pipette_wizard_flows', 'shared'])

  const hasSentCreateMaintenanceRun = useRef(false)
  useEffect(() => {
    if (createdMaintenanceRunId != null) return
    if (isCreateLoading || hasSentCreateMaintenanceRun.current) return
    if (!isDocumentationProvided(documentationState)) return

    hasSentCreateMaintenanceRun.current = true
    createMaintenanceRun({})
  }, [
    createMaintenanceRun,
    createdMaintenanceRunId,
    documentationState,
    isCreateLoading,
  ])
  const pipetteId = attachedPipettes[mount]?.serialNumber
  const isGantryEmpty = getIsGantryEmpty(attachedPipettes)
  const isGantryEmptyFor96ChannelAttachment =
    isGantryEmpty &&
    selectedPipette === NINETY_SIX_CHANNEL &&
    flowType === FLOWS.ATTACH
  const pipetteDisplayName = usePipetteNameSpecs(
    requiredPipette?.pipetteName!
  )?.displayName

  if (
    pipetteId == null &&
    (flowType === FLOWS.CALIBRATE || flowType === FLOWS.DETACH)
  ) {
    return null
  }

  let equipmentList = [CALIBRATION_PROBE]
  const proceedButtonText = t('move_gantry_to_front')
  const hexScrewdriverWithSubtitle = {
    ...HEX_SCREWDRIVER,
    subtitle: t('provided_with_robot'),
  }
  let bodyTranslationKey: string = ''

  switch (flowType) {
    case FLOWS.CALIBRATE: {
      bodyTranslationKey = 'remove_labware_to_get_started'
      if (
        selectedPipette === NINETY_SIX_CHANNEL &&
        isWasteChuteOnDeck(deckConfig)
      ) {
        equipmentList.push(hexScrewdriverWithSubtitle)
      }
      break
    }
    case FLOWS.ATTACH: {
      bodyTranslationKey = 'remove_labware'
      let displayName: string | undefined
      if (requiredPipette != null) {
        displayName = pipetteDisplayName ?? requiredPipette.pipetteName
      }
      if (selectedPipette === SINGLE_MOUNT_PIPETTES) {
        equipmentList = [
          { ...PIPETTE, displayName: displayName ?? PIPETTE.displayName },
          CALIBRATION_PROBE,
          hexScrewdriverWithSubtitle,
        ]
      } else {
        equipmentList = [
          {
            ...NINETY_SIX_CHANNEL_PIPETTE,
            displayName: displayName ?? NINETY_SIX_CHANNEL_PIPETTE.displayName,
          },
          CALIBRATION_PROBE,
          hexScrewdriverWithSubtitle,
          NINETY_SIX_CHANNEL_MOUNTING_PLATE,
        ]
      }
      break
    }
    case FLOWS.DETACH: {
      if (requiredPipette != null) {
        const displayName = pipetteDisplayName ?? requiredPipette.pipetteName
        bodyTranslationKey = 'remove_labware'

        if (
          requiredPipette.pipetteName === 'p1000_96' ||
          requiredPipette.pipetteName === 'p200_96'
        ) {
          equipmentList = [
            { ...NINETY_SIX_CHANNEL_PIPETTE, displayName },
            CALIBRATION_PROBE,
            hexScrewdriverWithSubtitle,
            NINETY_SIX_CHANNEL_MOUNTING_PLATE,
          ]
        } else {
          equipmentList = [
            { ...PIPETTE, displayName },
            CALIBRATION_PROBE,
            hexScrewdriverWithSubtitle,
          ]
        }
      } else {
        bodyTranslationKey = 'get_started_detach'
        equipmentList = [hexScrewdriverWithSubtitle]
      }
      break
    }
  }
  const rightHandBody = (
    <WizardRequiredEquipmentList width="100%" equipmentList={equipmentList} />
  )

  const handleOnClickCalibrateOrDetach = (): void => {
    const is96Channel =
      attachedPipettes[mount]?.instrumentName === 'p1000_96' ||
      attachedPipettes[mount]?.instrumentName === 'p200_96'
    let moveToFrontCommands: CreateCommand[] = [
      {
        commandType: 'loadPipette' as const,
        params: {
          pipetteName: attachedPipettes[mount]?.instrumentName ?? '',
          pipetteId: pipetteId ?? '',
          mount,
        },
      },
      { commandType: 'home' as const, params: {} },
      {
        commandType: 'calibration/moveToMaintenancePosition' as const,
        params: {
          mount,
          ...(is96Channel
            ? { motionModifier: 'lowerMountZAxis' as const }
            : {}),
        },
      },
    ]
    if (pipetteId == null) moveToFrontCommands = moveToFrontCommands.slice(1)
    chainRunCommands?.(moveToFrontCommands, false)
      .then(() => {
        proceed()
      })
      .catch(error => {
        setShowErrorMessage(error.message as string)
      })
  }

  const SingleMountAttachCommand: CreateCommand[] = [
    { commandType: 'home' as const, params: {} },
    {
      commandType: 'calibration/moveToMaintenancePosition' as const,
      params: {
        mount,
      },
    },
  ]

  const NinetySixChannelAttachCommand: CreateCommand[] = [
    { commandType: 'home' as const, params: {} },
    {
      commandType: 'calibration/moveToMaintenancePosition' as const,
      params: {
        mount: RIGHT,
        motionModifier: 'lowerZAxesSequentially',
      },
    },
  ]

  const handleOnClickAttach = (): void => {
    chainRunCommands?.(
      selectedPipette === SINGLE_MOUNT_PIPETTES
        ? SingleMountAttachCommand
        : NinetySixChannelAttachCommand,
      false
    )
      .then(() => {
        proceed()
      })
      .catch(error => {
        setShowErrorMessage(error.message as string)
      })
  }

  if (isRobotMoving) {
    return <SimpleWizardInProgressBody description={t('stand_back')} />
  }

  return errorMessage != null ? (
    <SimpleWizardBody
      isSuccess={false}
      iconColor={COLORS.red50}
      header={t('shared:error_encountered')}
      subHeader={errorMessage}
    />
  ) : (
    <GenericWizardTile
      header={t('before_you_begin')}
      rightHandBody={rightHandBody}
      bodyText={
        <>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing6}>
            <Trans
              t={t}
              i18nKey={bodyTranslationKey}
              components={{
                block: <LegacyStyledText css={BODY_STYLE} />,
              }}
            />
            {selectedPipette === NINETY_SIX_CHANNEL &&
              (flowType === FLOWS.ATTACH || flowType === FLOWS.DETACH) && (
                <Banner
                  type="warning"
                  size={Boolean(isOnDevice) ? '1.5rem' : '1rem'}
                  marginTop={
                    Boolean(isOnDevice) ? SPACING.spacing24 : SPACING.spacing16
                  }
                >
                  {t('pipette_heavy', { weight: WEIGHT_OF_96_CHANNEL })}
                </Banner>
              )}
          </Flex>
        </>
      }
      proceedButtonText={proceedButtonText}
      proceedIsDisabled={isCreateLoading || maintenanceRunId == null}
      proceed={
        isGantryEmptyFor96ChannelAttachment ||
        (flowType === FLOWS.ATTACH && selectedPipette === SINGLE_MOUNT_PIPETTES)
          ? handleOnClickAttach
          : handleOnClickCalibrateOrDetach
      }
    />
  )
}
