import { useTranslation } from 'react-i18next'

import { Chip, StyledText } from '@opentrons/components'
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

import styles from './modulecontainer.module.css'

import type { ModuleEntities, RobotState } from '@opentrons/step-generation'

interface ModuleContainerProps {
  moduleId: string
  moduleEntities: ModuleEntities
  moduleRobotState: RobotState['modules']
}

export function ModuleContainer({
  moduleId,
  moduleEntities,
  moduleRobotState,
}: ModuleContainerProps): JSX.Element {
  const { t } = useTranslation('protocol_visualization')
  const { model } = moduleEntities[moduleId]
  const { moduleState } = moduleRobotState[moduleId]
  const moduleDisplayName = getModuleDisplayName(model)

  let moduleDetails = <div></div>

  switch (moduleState.type) {
    case THERMOCYCLER_MODULE_TYPE: {
      const { blockTargetTemp, lidOpen, lidTargetTemp } = moduleState

      moduleDetails = (
        <div className={styles.module_details_status_container}>
          <div className={styles.module_details_status}>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('target_block_temperature')}
            </StyledText>
            <Chip
              type="info"
              hasIcon={false}
              text={
                blockTargetTemp != null
                  ? t('temperature', { temp: blockTargetTemp })
                  : t('deactivated')
              }
            />
          </div>
          <div className={styles.module_details_status}>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('target_lid_temperature')}
            </StyledText>
            <Chip
              type="info"
              hasIcon={false}
              text={
                lidTargetTemp != null
                  ? t('temperature', { temp: lidTargetTemp })
                  : t('deactivated')
              }
            />
          </div>
          <div className={styles.module_details_status}>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('lid_status')}
            </StyledText>
            <StyledText desktopStyle="bodyDefaultRegular">
              {lidOpen || lidOpen == null ? t('open') : t('closed')}
            </StyledText>
          </div>
        </div>
      )
      break
    }
    case HEATERSHAKER_MODULE_TYPE: {
      const { targetSpeed, targetTemp, latchOpen } = moduleState
      moduleDetails = (
        <div className={styles.module_details_status_container}>
          <div className={styles.module_details_status}>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('target_temperature')}
            </StyledText>
            <Chip
              type="info"
              hasIcon={false}
              text={
                targetTemp != null
                  ? t('temperature', { temp: targetTemp })
                  : t('deactivated')
              }
            />
          </div>
          <div className={styles.module_details_status}>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('target_speed')}
            </StyledText>
            <Chip
              type="info"
              hasIcon={false}
              text={
                targetSpeed != null
                  ? t('speed', { speed: targetSpeed })
                  : t('idle')
              }
            />
          </div>
          <div className={styles.module_details_status}>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('labware_latch')}
            </StyledText>
            <StyledText desktopStyle="bodyDefaultRegular">
              {latchOpen || latchOpen == null
                ? t('open')
                : t('closed_and_locked')}
            </StyledText>
          </div>
        </div>
      )
      break
    }
    case MAGNETIC_MODULE_TYPE: {
      const { engaged } = moduleState
      moduleDetails = (
        <div className={styles.module_details_status_container}>
          <div className={styles.module_details_status}>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('status')}
            </StyledText>
            <Chip
              type="info"
              hasIcon={false}
              text={engaged ? t('engaged') : t('disengaged')}
            />
          </div>
        </div>
      )
      break
    }
    case TEMPERATURE_MODULE_TYPE: {
      const { status, targetTemperature } = moduleState
      break
    }
    case ABSORBANCE_READER_TYPE: {
      const { lidOpen, initialization } = moduleState
      break
    }
    case FLEX_STACKER_MODULE_TYPE: {
      const {
        maxPoolCount,
        storedLabwareDetails,
        labwareInHopper,
        labwareOnShuttle,
      } = moduleState
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
        <StyledText desktopStyle="captionRegular">
          {moduleDisplayName}
        </StyledText>
        {moduleDetails}
      </div>
    </div>
  )
}
