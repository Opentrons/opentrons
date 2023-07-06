import * as React from 'react'
import { UseMutateFunction } from 'react-query'
import { Trans, useTranslation } from 'react-i18next'
import { COLORS } from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { WizardRequiredEquipmentList } from '../../molecules/WizardRequiredEquipmentList'
import {
  GRIPPER_FLOW_TYPES,
  SCREWDRIVER_LOADNAME,
  GRIPPER_LOADNAME,
  CAL_PIN_LOADNAME,
} from './constants'
import type {
  CreateMaintenanceRunData,
  MaintenanceRun,
} from '@opentrons/api-client'
import type { GripperWizardFlowType, GripperWizardStepProps } from './types'
import type { AxiosError } from 'axios'
import { EXTENSION } from '@opentrons/shared-data'
import type { CreateCommand } from '@opentrons/shared-data'

interface BeforeBeginningInfo {
  bodyI18nKey: string
  equipmentLoadNames: string[]
}

const INFO_BY_FLOW_TYPE: {
  [flowType in GripperWizardFlowType]: BeforeBeginningInfo
} = {
  [GRIPPER_FLOW_TYPES.ATTACH]: {
    bodyI18nKey: 'remove_labware_to_get_started_attaching',
    equipmentLoadNames: [
      GRIPPER_LOADNAME,
      SCREWDRIVER_LOADNAME,
      CAL_PIN_LOADNAME,
    ],
  },
  [GRIPPER_FLOW_TYPES.DETACH]: {
    bodyI18nKey: 'remove_labware_to_get_started_detaching',
    equipmentLoadNames: [SCREWDRIVER_LOADNAME],
  },
  [GRIPPER_FLOW_TYPES.RECALIBRATE]: {
    bodyI18nKey: 'remove_labware_to_get_started_recalibrating',
    equipmentLoadNames: [GRIPPER_LOADNAME, CAL_PIN_LOADNAME],
  },
}
interface BeforeBeginningProps extends GripperWizardStepProps {
  createMaintenanceRun: UseMutateFunction<
    MaintenanceRun,
    AxiosError<any>,
    CreateMaintenanceRunData,
    unknown
  >
  isCreateLoading: boolean
}

export const BeforeBeginning = (
  props: BeforeBeginningProps
): JSX.Element | null => {
  const {
    proceed,
    createMaintenanceRun,
    flowType,
    isCreateLoading,
    isRobotMoving,
    chainRunCommands,
    errorMessage,
    setShowErrorMessage,
  } = props
  const { t } = useTranslation(['gripper_wizard_flows', 'shared'])
  React.useEffect(() => {
    createMaintenanceRun({})
  }, [])

  const commandsOnProceed: CreateCommand[] = [
    { commandType: 'home' as const, params: {} },
    {
      // @ts-expect-error(BC, 2022-03-10): this will pass type checks when we update command types from V6 to V7 in shared-data
      commandType: 'calibration/moveToMaintenancePosition' as const,
      params: {
        mount: EXTENSION,
      },
    },
  ]

  const handleOnClick = (): void => {
    chainRunCommands(commandsOnProceed, false)
      .then(() => {
        proceed()
      })
      .catch(error => {
        setShowErrorMessage(error.message)
      })
  }

  const equipmentInfoByLoadName: {
    [loadName: string]: { displayName: string; subtitle?: string }
  } = {
    calibration_pin: { displayName: t('calibration_pin') },
    hex_screwdriver: {
      displayName: t('hex_screwdriver'),
      subtitle: t('provided_with_robot_use_right_size'),
    },
    [GRIPPER_LOADNAME]: { displayName: t('gripper') },
  }

  const { bodyI18nKey, equipmentLoadNames } = INFO_BY_FLOW_TYPE[flowType]
  const equipmentList = equipmentLoadNames.map(loadName => {
    const { displayName, subtitle } = equipmentInfoByLoadName[loadName]
    return { loadName, displayName, subtitle }
  })

  if (isRobotMoving)
    return (
      <InProgressModal
        description={t('shared:stand_back_robot_is_in_motion')}
      />
    )
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
      //  TODO(BC, 11/8/22): wire up this URL and unhide the link!
      // getHelp={BEFORE_YOU_BEGIN_URL}
      rightHandBody={
        <WizardRequiredEquipmentList equipmentList={equipmentList} />
      }
      bodyText={
        <Trans
          t={t}
          i18nKey={bodyI18nKey}
          components={{ block: <StyledText as="p" /> }}
        />
      }
      proceedButtonText={t('move_gantry_to_front')}
      proceedIsDisabled={isCreateLoading}
      proceed={handleOnClick}
    />
  )
}
