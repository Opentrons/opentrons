import * as React from 'react'
import { UseMutateFunction } from 'react-query'
import { COLORS } from '@opentrons/components'
import {
  LEFT,
  NINETY_SIX_CHANNEL,
  RIGHT,
  SINGLE_MOUNT_PIPETTES,
  WEIGHT_OF_96_CHANNEL,
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
import type { Run, CreateRunData } from '@opentrons/api-client'
import type { PipetteWizardStepProps } from './types'

interface BeforeBeginningProps extends PipetteWizardStepProps {
  createRun: UseMutateFunction<Run, AxiosError<any>, CreateRunData, unknown>
  isCreateLoading: boolean
}
export const BeforeBeginning = (
  props: BeforeBeginningProps
): JSX.Element | null => {
  const {
    proceed,
    flowType,
    createRun,
    attachedPipettes,
    chainRunCommands,
    isCreateLoading,
    mount,
    isRobotMoving,
    errorMessage,
    setShowErrorMessage,
    selectedPipette,
  } = props
  const { t } = useTranslation('pipette_wizard_flows')
  React.useEffect(() => {
    createRun({})
  }, [])
  const pipetteId = attachedPipettes[mount]?.id

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
  let proceedButtonText: string = t('get_started')
  let bodyTranslationKey: string = ''

  switch (flowType) {
    case FLOWS.CALIBRATE: {
      proceedButtonText = t('move_gantry_to_front')
      bodyTranslationKey = 'remove_labware_to_get_started'
      break
    }
    case FLOWS.ATTACH: {
      bodyTranslationKey = 'remove_labware'
      proceedButtonText = t('move_gantry_to_front')
      if (selectedPipette === SINGLE_MOUNT_PIPETTES) {
        equipmentList = [PIPETTE, CALIBRATION_PROBE, HEX_SCREWDRIVER]
      } else {
        equipmentList = [
          NINETY_SIX_CHANNEL_PIPETTE,
          CALIBRATION_PROBE,
          HEX_SCREWDRIVER,
          NINETY_SIX_CHANNEL_MOUNTING_PLATE,
        ]
      }
      break
    }
    case FLOWS.DETACH: {
      bodyTranslationKey = 'get_started_detach'
      equipmentList = [HEX_SCREWDRIVER]
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
          // @ts-expect-error pipetteName is required but missing in schema v6 type
          pipetteName: attachedPipettes[mount]?.name,
          pipetteId: pipetteId,
          mount: mount,
        },
      },
      {
        // @ts-expect-error calibration type not yet supported
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
    {
      // @ts-expect-error calibration type not yet supported
      commandType: 'calibration/moveToMaintenancePosition' as const,
      params: {
        mount: mount,
      },
    },
  ]

  const NinetySixChannelAttachCommand: CreateCommand[] = [
    {
      // @ts-expect-error calibration type not yet supported
      commandType: 'calibration/moveToMaintenancePosition' as const,
      params: {
        mount: LEFT,
      },
    },
    {
      // @ts-expect-error calibration type not yet supported
      commandType: 'calibration/moveToMaintenancePosition' as const,
      params: {
        mount: RIGHT,
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
      header={t('error_encountered')}
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
          <Trans
            t={t}
            i18nKey={bodyTranslationKey}
            components={{
              block: <StyledText css={BODY_STYLE} />,
            }}
          />
          {selectedPipette === NINETY_SIX_CHANNEL &&
          (flowType === FLOWS.DETACH || flowType === FLOWS.ATTACH) ? (
            <Banner type="warning">
              {t('pipette_heavy', { weight: WEIGHT_OF_96_CHANNEL })}
            </Banner>
          ) : null}
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
