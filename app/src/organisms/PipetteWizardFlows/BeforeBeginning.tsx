import * as React from 'react'
import { UseMutateFunction } from 'react-query'
import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SIZE_1,
  SPACING,
} from '@opentrons/components'
import {
  NINETY_SIX_CHANNEL,
  RIGHT,
  SINGLE_MOUNT_PIPETTES,
  WEIGHT_OF_96_CHANNEL,
  LoadedPipette,
  getPipetteNameSpecs,
} from '@opentrons/shared-data'
import { Trans, useTranslation } from 'react-i18next'
import { StyledText } from '../../atoms/text'
import { Banner } from '../../atoms/Banner'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { WizardRequiredEquipmentList } from '../../molecules/WizardRequiredEquipmentList'
import {
  CALIBRATION_PROBE,
  FLOWS,
  PIPETTE,
  HEX_SCREWDRIVER,
  NINETY_SIX_CHANNEL_PIPETTE,
  NINETY_SIX_CHANNEL_MOUNTING_PLATE,
  BODY_STYLE,
} from './constants'
import { getIsGantryEmpty } from './utils'
import type { AxiosError } from 'axios'
import type { CreateCommand } from '@opentrons/shared-data'
import type {
  CreateMaintenanceRunData,
  MaintenanceRun,
} from '@opentrons/api-client'
import type { PipetteWizardStepProps } from './types'

interface BeforeBeginningProps extends PipetteWizardStepProps {
  createMaintenanceRun: UseMutateFunction<
    MaintenanceRun,
    AxiosError<any>,
    CreateMaintenanceRunData,
    unknown
  >
  isCreateLoading: boolean
  requiredPipette?: LoadedPipette
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
  } = props
  const { t } = useTranslation(['pipette_wizard_flows', 'shared'])
  React.useEffect(() => {
    createMaintenanceRun({})
  }, [])
  const pipetteId = attachedPipettes[mount]?.serialNumber
  const isGantryEmpty = getIsGantryEmpty(attachedPipettes)
  const isGantryEmptyFor96ChannelAttachment =
    isGantryEmpty &&
    selectedPipette === NINETY_SIX_CHANNEL &&
    flowType === FLOWS.ATTACH

  if (
    pipetteId == null &&
    (flowType === FLOWS.CALIBRATE || flowType === FLOWS.DETACH)
  )
    return null

  let equipmentList = [CALIBRATION_PROBE]
  const proceedButtonText = t('move_gantry_to_front')
  let bodyTranslationKey: string = ''

  switch (flowType) {
    case FLOWS.CALIBRATE: {
      bodyTranslationKey = 'remove_labware_to_get_started'
      break
    }
    case FLOWS.ATTACH: {
      bodyTranslationKey = 'remove_labware'
      let displayName: string | undefined
      if (requiredPipette != null) {
        displayName =
          getPipetteNameSpecs(requiredPipette.pipetteName)?.displayName ??
          requiredPipette.pipetteName
      }
      if (selectedPipette === SINGLE_MOUNT_PIPETTES) {
        equipmentList = [
          { ...PIPETTE, displayName: displayName ?? PIPETTE.displayName },
          CALIBRATION_PROBE,
          HEX_SCREWDRIVER,
        ]
      } else {
        equipmentList = [
          {
            ...NINETY_SIX_CHANNEL_PIPETTE,
            displayName: displayName ?? NINETY_SIX_CHANNEL_PIPETTE.displayName,
          },
          CALIBRATION_PROBE,
          HEX_SCREWDRIVER,
          NINETY_SIX_CHANNEL_MOUNTING_PLATE,
        ]
      }
      break
    }
    case FLOWS.DETACH: {
      if (requiredPipette != null) {
        const displayName =
          getPipetteNameSpecs(requiredPipette.pipetteName)?.displayName ??
          requiredPipette.pipetteName
        bodyTranslationKey = 'remove_labware'

        if (requiredPipette.pipetteName === 'p1000_96') {
          equipmentList = [
            { ...NINETY_SIX_CHANNEL_PIPETTE, displayName: displayName },
            CALIBRATION_PROBE,
            HEX_SCREWDRIVER,
            NINETY_SIX_CHANNEL_MOUNTING_PLATE,
          ]
        } else {
          equipmentList = [
            { ...PIPETTE, displayName: displayName },
            CALIBRATION_PROBE,
            HEX_SCREWDRIVER,
          ]
        }
      } else {
        bodyTranslationKey = 'get_started_detach'
        equipmentList = [HEX_SCREWDRIVER]
      }
      break
    }
  }
  const rightHandBody = (
    <WizardRequiredEquipmentList width="100%" equipmentList={equipmentList} />
  )

  const handleOnClickCalibrateOrDetach = (): void => {
    let moveToFrontCommands: CreateCommand[] = [
      {
        commandType: 'loadPipette' as const,
        params: {
          pipetteName: attachedPipettes[mount]?.instrumentName ?? '',
          pipetteId: pipetteId ?? '',
          mount: mount,
        },
      },
      { commandType: 'home' as const, params: {} },
      {
        commandType: 'calibration/moveToMaintenancePosition' as const,
        params: {
          mount: mount,
        },
      },
    ]
    if (pipetteId == null) moveToFrontCommands = moveToFrontCommands.slice(1)
    chainRunCommands(moveToFrontCommands, false)
      .then(() => {
        proceed()
      })
      .catch(error => {
        setShowErrorMessage(error.message)
      })
  }

  const SingleMountAttachCommand: CreateCommand[] = [
    { commandType: 'home' as const, params: {} },
    {
      commandType: 'calibration/moveToMaintenancePosition' as const,
      params: {
        mount: mount,
      },
    },
  ]

  const NinetySixChannelAttachCommand: CreateCommand[] = [
    { commandType: 'home' as const, params: {} },
    {
      commandType: 'calibration/moveToMaintenancePosition' as const,
      params: {
        mount: RIGHT,
        maintenancePosition: 'attachPlate',
      },
    },
  ]

  const handleOnClickAttach = (): void => {
    chainRunCommands(
      selectedPipette === SINGLE_MOUNT_PIPETTES
        ? SingleMountAttachCommand
        : NinetySixChannelAttachCommand,
      false
    )
      .then(() => {
        proceed()
      })
      .catch(error => {
        setShowErrorMessage(error.message)
      })
  }

  if (isRobotMoving) return <InProgressModal description={t('stand_back')} />

  return errorMessage != null ? (
    <SimpleWizardBody
      isSuccess={false}
      iconColor={COLORS.errorEnabled}
      header={t('shared:error_encountered')}
      subHeader={errorMessage}
    />
  ) : (
    <GenericWizardTile
      header={t('before_you_begin')}
      //  TODO(jr, 11/3/22): wire up this URL and unhide the link!
      // getHelp={BEFORE_YOU_BEGIN_URL}
      rightHandBody={rightHandBody}
      bodyText={
        <>
          {selectedPipette === NINETY_SIX_CHANNEL &&
          (flowType === FLOWS.DETACH || flowType === FLOWS.ATTACH) ? (
            <Banner
              type="warning"
              size={isOnDevice ? '1.5rem' : SIZE_1}
              marginY={SPACING.spacing4}
            >
              {t('pipette_heavy', { weight: WEIGHT_OF_96_CHANNEL })}
            </Banner>
          ) : null}
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing6}>
            <Trans
              t={t}
              i18nKey={bodyTranslationKey}
              components={{
                block: <StyledText css={BODY_STYLE} />,
              }}
            />
          </Flex>
        </>
      }
      proceedButtonText={proceedButtonText}
      proceedIsDisabled={isCreateLoading}
      proceed={
        isGantryEmptyFor96ChannelAttachment ||
        (flowType === FLOWS.ATTACH && selectedPipette === SINGLE_MOUNT_PIPETTES)
          ? handleOnClickAttach
          : handleOnClickCalibrateOrDetach
      }
    />
  )
}
