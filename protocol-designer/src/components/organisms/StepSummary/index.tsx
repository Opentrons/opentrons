import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import styled from 'styled-components'

import {
  DIRECTION_COLUMN,
  Flex,
  ListItem,
  SPACING,
  StyledText,
  WRAP,
} from '@opentrons/components'
import {
  getModuleDisplayName,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'

import { formatTime } from '../../../pages/Designer/utils'
import {
  getAdditionalEquipmentEntities,
  getLabwareEntities,
  getLiquidEntities,
  getModuleEntities,
} from '../../../step-forms/selectors'
import { getRobotStateAtActiveItem } from '../../../top-selectors/labware-locations'
import { getLabwareNicknamesById } from '../../../ui/labware/selectors'
import { LINE_CLAMP_TEXT_STYLE } from '../../atoms'
import { MixSummary } from './MixSummary'
import { MoveLiquidSummary } from './MoveLiquidSummary'
import { StyledTrans } from './StyledTrans'

import type { FormData } from '../../../form-types'

interface StepSummaryProps {
  currentStep: FormData | null
  stepDetails?: string
}

//  TODO: refactor the different step types to be in their own functions
//  similarly to what has been done for Mix and MoveLiquid
export function StepSummary(props: StepSummaryProps): JSX.Element | null {
  const { currentStep, stepDetails } = props
  const { t } = useTranslation(['protocol_steps', 'application'])
  const unknownModule = t('unknown_module')
  const labwareNicknamesById = useSelector(getLabwareNicknamesById)
  const additionalEquipmentEntities = useSelector(
    getAdditionalEquipmentEntities
  )
  const robotState = useSelector(getRobotStateAtActiveItem)

  const labwareEntities = useSelector(getLabwareEntities)
  const liquidEntities = useSelector(getLiquidEntities)
  const modules = useSelector(getModuleEntities)
  if (currentStep?.stepType == null || robotState == null) {
    return null
  }
  const { stepType } = currentStep
  const { liquidState } = robotState
  let stepSummaryContent: JSX.Element | null = null
  switch (stepType) {
    case 'mix': {
      stepSummaryContent = (
        <MixSummary
          currentStep={currentStep}
          labwareNicknamesById={labwareNicknamesById}
          liquidState={liquidState}
          liquidEntities={liquidEntities}
          labwareEntities={labwareEntities}
        />
      )

      break
    }

    case 'magnet': {
      const {
        moduleId: magneticModuleId,
        engageHeight,
        magnetAction,
      } = currentStep
      const moduleModel = modules[magneticModuleId]?.model
      const magneticModuleDisplayName =
        moduleModel != null ? getModuleDisplayName(moduleModel) : unknownModule
      stepSummaryContent =
        magnetAction === 'engage' ? (
          <StyledTrans
            i18nKey="protocol_steps:magnetic_module.engage"
            tagText={`${engageHeight}${t('application:units.millimeter')}`}
            values={{ module: magneticModuleDisplayName }}
          />
        ) : (
          <StyledTrans
            i18nKey="protocol_steps:magnetic_module.disengage"
            values={{ module: magneticModuleDisplayName }}
          />
        )
      break
    }

    case 'thermocycler': {
      const {
        lidIsActive,
        lidTargetTemp,
        blockIsActive,
        blockTargetTemp,
        lidOpen,
        thermocyclerFormType,
        lidOpenHold,
        blockTargetTempHold,
        profileTargetLidTemp,
        profileVolume,
      } = currentStep
      stepSummaryContent =
        thermocyclerFormType === 'thermocyclerState' ? (
          <StepSummaryContainer>
            {blockIsActive ? (
              <StyledTrans
                i18nKey="protocol_steps:thermocycler_module.thermocycler_state.block"
                tagText={`${blockTargetTemp}${t('application:units.degrees')}`}
              />
            ) : null}
            {lidIsActive ? (
              <StyledTrans
                i18nKey="protocol_steps:thermocycler_module.thermocycler_state.lid_temperature"
                tagText={`${lidTargetTemp}${t('application:units.degrees')}`}
              />
            ) : null}
            <StyledTrans
              i18nKey="protocol_steps:thermocycler_module.thermocycler_state.lid_position"
              tagText={t(
                `protocol_steps:thermocycler_module.lid_position.${
                  lidOpen ? 'open' : 'closed'
                }`
              )}
            />
          </StepSummaryContainer>
        ) : (
          <StepSummaryContainer>
            <StyledTrans
              i18nKey="protocol_steps:thermocycler_module.thermocycler_profile.volume"
              tagText={`${profileVolume} ${t('application:units.microliter')}`}
            />
            <StyledTrans
              i18nKey="protocol_steps:thermocycler_module.thermocycler_profile.lid_temperature"
              tagText={`${profileTargetLidTemp}${t(
                'application:units.degrees'
              )}`}
            />
            <StyledTrans
              i18nKey="protocol_steps:thermocycler_module.thermocycler_profile.end_hold.block"
              tagText={`${blockTargetTempHold}${t(
                'application:units.degrees'
              )}`}
            />
            <StyledTrans
              i18nKey="protocol_steps:thermocycler_module.thermocycler_profile.end_hold.lid_position"
              tagText={t(
                `protocol_steps:thermocycler_module.lid_position.${
                  lidOpenHold ? 'open' : 'closed'
                }`
              )}
            />
          </StepSummaryContainer>
        )
      break
    }

    case 'pause': {
      const {
        moduleId: pauseModuleId,
        pauseAction,
        pauseTime,
        pauseTemperature,
      } = currentStep
      switch (pauseAction) {
        case 'untilResume':
          stepSummaryContent = (
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('protocol_steps:pause.untilResume')}
            </StyledText>
          )
          break
        case 'untilTemperature':
          const moduleModel = modules[pauseModuleId]?.model
          const pauseModuleDisplayName =
            modules[pauseModuleId]?.model != null
              ? getModuleDisplayName(moduleModel)
              : unknownModule
          stepSummaryContent = (
            <StyledTrans
              i18nKey="protocol_steps:pause.untilTemperature"
              values={{ module: pauseModuleDisplayName }}
              tagText={`${pauseTemperature}${t('application:units.degrees')}`}
            />
          )
          break
        case 'untilTime':
          stepSummaryContent = (
            <StyledTrans
              i18nKey={t('protocol_steps:pause.untilTime')}
              tagText={formatTime(pauseTime as string)}
            />
          )
          break
      }
      break
    }

    case 'temperature': {
      const {
        moduleId: tempModuleId,
        setTemperature,
        targetTemperature,
      } = currentStep
      const isSettingTemperature =
        setTemperature != null && JSON.parse(String(setTemperature ?? false))
      const moduleModel = modules[tempModuleId]?.model
      const tempModuleDisplayName =
        moduleModel != null
          ? getModuleDisplayName(modules[tempModuleId]?.model)
          : unknownModule
      stepSummaryContent = isSettingTemperature ? (
        <StyledTrans
          i18nKey={'protocol_steps:temperature_module.active'}
          tagText={`${targetTemperature}${t('application:units.degrees')}`}
          values={{ module: tempModuleDisplayName }}
        />
      ) : (
        <StyledTrans
          i18nKey={'protocol_steps:temperature_module.deactivated'}
          values={{ module: tempModuleDisplayName }}
        />
      )
      break
    }

    case 'moveLabware': {
      const { labware, newLocation, useGripper } = currentStep
      const labwareName = labwareNicknamesById[labware]
      let newLocationName = newLocation
      if (newLocation in modules) {
        newLocationName = getModuleDisplayName(modules[newLocation].model)
      } else if (newLocation in labwareEntities) {
        newLocationName = labwareNicknamesById[newLocation]
      } else if (newLocation === 'offDeck') {
        newLocationName = t('off_deck')
      } else if (newLocation === WASTE_CHUTE_CUTOUT) {
        newLocationName = t('shared:wasteChute')
      }
      stepSummaryContent = (
        <StyledTrans
          i18nKey={
            useGripper
              ? 'protocol_steps:move_labware.gripper'
              : 'protocol_steps:move_labware.no_gripper'
          }
          values={{
            labware: labwareName,
          }}
          tagText={newLocationName}
        />
      )
      break
    }

    case 'moveLiquid': {
      stepSummaryContent = (
        <MoveLiquidSummary
          currentStep={currentStep}
          labwareNicknamesById={labwareNicknamesById}
          liquidState={liquidState}
          liquidEntities={liquidEntities}
          labwareEntities={labwareEntities}
          additionalEquipmentEntities={additionalEquipmentEntities}
        />
      )
      break
    }

    case 'heaterShaker': {
      const {
        latchOpen,
        heaterShakerTimer,
        moduleId: heaterShakerModuleId,
        targetHeaterShakerTemperature,
        targetSpeed,
      } = currentStep
      const moduleModel = modules[heaterShakerModuleId]?.model
      const moduleDisplayName =
        moduleModel != null ? getModuleDisplayName(moduleModel) : unknownModule
      stepSummaryContent = (
        <StepSummaryContainer>
          <StyledTrans
            i18nKey="protocol_steps:heater_shaker.active.temperature"
            values={{ module: moduleDisplayName }}
            tagText={
              targetHeaterShakerTemperature
                ? `${targetHeaterShakerTemperature}${t(
                    'application:units.degrees'
                  )}`
                : t('protocol_steps:heater_shaker.active.ambient')
            }
          />
          {targetSpeed ? (
            <StyledTrans
              i18nKey="protocol_steps:heater_shaker.active.shake"
              tagText={`${targetSpeed}${t('application:units.rpm')}`}
            />
          ) : null}
          {heaterShakerTimer ? (
            <StyledTrans
              i18nKey="protocol_steps:heater_shaker.active.time"
              tagText={formatTime(heaterShakerTimer as string)}
            />
          ) : null}
          <StyledTrans
            i18nKey="protocol_steps:heater_shaker.active.latch"
            tagText={t(
              latchOpen
                ? 'protocol_steps:heater_shaker.latch.open'
                : 'protocol_steps:heater_shaker.latch.closed'
            )}
          />
        </StepSummaryContainer>
      )
      break
    }

    default:
      stepSummaryContent = null
  }

  return stepSummaryContent != null || stepDetails != null ? (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing4}
      width="100%"
      height="100%"
    >
      {stepSummaryContent != null ? (
        <ListItem type="default">
          <Flex padding={SPACING.spacing12}>{stepSummaryContent}</Flex>
        </ListItem>
      ) : null}
      {stepDetails != null && stepDetails !== '' ? (
        <ListItem type="default">
          <Flex padding={SPACING.spacing12}>
            <StyledText
              desktopStyle="bodyDefaultRegular"
              css={LINE_CLAMP_TEXT_STYLE(3)}
            >
              {stepDetails}
            </StyledText>
          </Flex>
        </ListItem>
      ) : null}
    </Flex>
  ) : null
}

const StepSummaryContainer = styled(Flex)`
  flex-wrap: ${WRAP};
  gap: ${SPACING.spacing20};
  row-gap: ${SPACING.spacing4};
`
