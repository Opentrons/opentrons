import * as React from 'react'
import { UseMutateFunction } from 'react-query'
import { Trans, useTranslation } from 'react-i18next'
import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { WizardRequiredEquipmentList } from '../../molecules/WizardRequiredEquipmentList'
import {
  GRIPPER_FLOW_TYPES,
  SCREWDRIVER_LOADNAME,
  GRIPPER_LOADNAME,
  CAL_PIN_LOADNAME,
} from './constants'
import type { Run, CreateRunData } from '@opentrons/api-client'
import type { GripperWizardFlowType, GripperWizardStepProps } from './types'
import type { AxiosError } from 'axios'

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
  createRun: UseMutateFunction<Run, AxiosError<any>, CreateRunData, unknown>
  isCreateLoading: boolean
}

export const BeforeBeginning = (
  props: BeforeBeginningProps
): JSX.Element | null => {
  const {
    proceed,
    createRun,
    flowType,
    attachedGripper,
    isCreateLoading,
    isRobotMoving,
    // chainRunCommands,
    // setIsBetweenCommands,
  } = props
  const { t } = useTranslation(['gripper_wizard_flows', 'shared'])
  React.useEffect(() => {
    createRun({})
  }, [])

  if (attachedGripper == null) return null
  const handleOnClick = (): void => {
    // setIsBetweenCommands(true)
    // chainRunCommands([
    //   {
    //     commandType: 'home' as const,
    //     params: {},
    //   },
    // ]).then(() => {
    //   setIsBetweenCommands(false)
    //   proceed()
    // })
    proceed()
  }

  const equipmentInfoByLoadName: {
    [loadName: string]: { displayName: string; subtitle?: string }
  } = {
    calibration_pin: { displayName: t('calibration_pin') },
    t10_torx_screwdriver: {
      displayName: t('t10_torx_screwdriver'),
      subtitle: t('provided_with_robot_use_right_size'),
    },
    opentrons_gripper: { displayName: t('gripper') },
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
  return (
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
