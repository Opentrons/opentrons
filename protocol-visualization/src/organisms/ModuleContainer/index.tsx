import { useTranslation } from 'react-i18next'

import { Chip, RobotInfoLabel, StyledText } from '@opentrons/components'
import {
  ABSORBANCE_READER_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  getModuleDisplayName,
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_BLOCK_TYPE,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import { ModuleStatusContainer } from '../ModuleStatusContainer'
import styles from './modulecontainer.module.css'

import type { ModuleEntities, RobotState } from '@opentrons/step-generation'

interface ModuleContainerProps {
  moduleId: string
  moduleEntities: ModuleEntities
  moduleRobotState: RobotState['modules']
  slotId: string
}

export function ModuleContainer({
  moduleId,
  moduleEntities,
  moduleRobotState,
  slotId,
}: ModuleContainerProps): JSX.Element {
  const { t } = useTranslation('protocol_visualization')
  const { model } = moduleEntities[moduleId]
  const { moduleState } = moduleRobotState[moduleId]
  const moduleDisplayName = getModuleDisplayName(model)

  let moduleDetails = null

  switch (moduleState.type) {
    case THERMOCYCLER_MODULE_TYPE: {
      const { currentBlockActivity, lidOpen, lidTargetTemp } = moduleState

      let blockTemperatureText
      switch (currentBlockActivity.type) {
        case 'blockTargetTemp':
          blockTemperatureText = t('temperature', {
            temp: currentBlockActivity.blockTargetTemp,
          })
          break
        case 'profile':
          const profileElements = currentBlockActivity.profileElements
          const lastElement = profileElements[profileElements.length - 1]

          const endingTemp =
            'celsius' in lastElement
              ? lastElement.celsius
              : lastElement.steps[lastElement.steps.length - 1]?.celsius

          blockTemperatureText = t('temperature', {
            temp: endingTemp,
          })
          break
        case 'blockDeactivated':
          blockTemperatureText = t('idle')
          break
        default:
          currentBlockActivity satisfies never
      }

      moduleDetails = (
        <div className={styles.module_details_status_container}>
          <ModuleStatusContainer title="target_block_temperature">
            <StyledText desktopStyle="bodyDefaultRegular">
              {blockTemperatureText}
            </StyledText>
          </ModuleStatusContainer>
          <ModuleStatusContainer title="target_lid_temperature">
            <StyledText desktopStyle="bodyDefaultRegular">
              {lidTargetTemp != null
                ? t('temperature', { temp: lidTargetTemp })
                : t('idle')}
            </StyledText>
          </ModuleStatusContainer>
          <ModuleStatusContainer title="lid_status">
            <Chip
              type="neutral"
              hasIcon={false}
              text={lidOpen || lidOpen == null ? t('open') : t('closed')}
            />
          </ModuleStatusContainer>
        </div>
      )
      break
    }
    case HEATERSHAKER_MODULE_TYPE: {
      const { targetSpeed, targetTemp, latchOpen } = moduleState
      moduleDetails = (
        <div className={styles.module_details_status_container}>
          <ModuleStatusContainer title="target_temperature">
            <StyledText desktopStyle="bodyDefaultRegular">
              {targetTemp != null
                ? t('temperature', { temp: targetTemp })
                : t('idle')}
            </StyledText>
          </ModuleStatusContainer>
          <ModuleStatusContainer title="target_speed">
            <StyledText desktopStyle="bodyDefaultRegular">
              {targetSpeed != null
                ? t('speed', { speed: targetSpeed })
                : t('idle')}
            </StyledText>
          </ModuleStatusContainer>
          <ModuleStatusContainer title="labware_latch">
            <Chip
              type="neutral"
              hasIcon={false}
              text={
                latchOpen || latchOpen == null
                  ? t('open')
                  : t('closed_and_locked')
              }
            />
          </ModuleStatusContainer>
        </div>
      )
      break
    }
    case MAGNETIC_MODULE_TYPE: {
      const { engaged } = moduleState
      moduleDetails = (
        <div className={styles.module_details_status_container}>
          <ModuleStatusContainer title="status">
            <Chip
              type={engaged ? 'info' : 'neutral'}
              iconName="connection-status"
              text={engaged ? t('engaged') : t('disengaged')}
            />
          </ModuleStatusContainer>
        </div>
      )
      break
    }
    case TEMPERATURE_MODULE_TYPE: {
      const { targetTemperature } = moduleState
      moduleDetails = (
        <div className={styles.module_details_status_container}>
          <ModuleStatusContainer title="target_temperature">
            <StyledText desktopStyle="bodyDefaultRegular">
              {targetTemperature != null
                ? t('temperature', { temp: targetTemperature })
                : t('idle')}
            </StyledText>
          </ModuleStatusContainer>
        </div>
      )
      break
    }
    case ABSORBANCE_READER_TYPE: {
      const { lidOpen, initialization } = moduleState
      moduleDetails = (
        <div className={styles.module_details_status_container}>
          <ModuleStatusContainer title="lid_status">
            <Chip
              type="neutral"
              hasIcon={false}
              text={lidOpen || lidOpen == null ? t('open') : t('closed')}
            />
          </ModuleStatusContainer>
          {initialization != null ? (
            <>
              <div className={styles.module_details_status}>
                <StyledText desktopStyle="bodyDefaultRegular">
                  {t('initialization')}
                </StyledText>
                <StyledText desktopStyle="bodyDefaultRegular">
                  {initialization.mode}
                </StyledText>
              </div>
              <div className={styles.module_details_status}>
                <StyledText desktopStyle="bodyDefaultRegular">
                  {t('wavelengths')}
                </StyledText>
                <StyledText desktopStyle="bodyDefaultRegular">
                  {initialization.wavelengths}
                </StyledText>
              </div>
              {initialization.referenceWavelength != null ? (
                <div className={styles.module_details_status}>
                  <StyledText desktopStyle="bodyDefaultRegular">
                    {t('reference_wavelength')}
                  </StyledText>
                  <StyledText desktopStyle="bodyDefaultRegular">
                    {initialization.referenceWavelength}
                  </StyledText>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      )
      break
    }
    case FLEX_STACKER_MODULE_TYPE: {
      const { labwareInHopper } = moduleState
      moduleDetails = (
        <div className={styles.module_details_status_container}>
          <ModuleStatusContainer title={t('number_of_labware_in_stacker')}>
            <StyledText desktopStyle="bodyDefaultRegular">
              {labwareInHopper != null ? labwareInHopper.length : 0}
            </StyledText>
          </ModuleStatusContainer>
        </div>
      )
      break
    }
    case MAGNETIC_BLOCK_TYPE: {
      //  no state to show
      break
    }
    default:
      console.error(
        `ran into the default moduleContainer moduleState with module ${moduleDisplayName}`
      )
  }

  return (
    <div className={styles.container}>
      <div className={styles.main_content}>
        <RobotInfoLabel deckLabel={slotId} />
        <StyledText desktopStyle="bodyDefaultSemiBold">
          {moduleDisplayName}
        </StyledText>
        {moduleDetails}
      </div>
    </div>
  )
}
