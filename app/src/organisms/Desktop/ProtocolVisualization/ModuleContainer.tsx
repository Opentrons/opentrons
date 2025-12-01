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
            <StyledText desktopStyle="bodyDefaultRegular">
              {blockTargetTemp != null
                ? t('temperature', { temp: blockTargetTemp })
                : t('deactivated')}
            </StyledText>
          </div>
          <div className={styles.module_details_status}>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('target_lid_temperature')}
            </StyledText>
            <StyledText desktopStyle="bodyDefaultRegular">
              {lidTargetTemp != null
                ? t('temperature', { temp: lidTargetTemp })
                : t('deactivated')}
            </StyledText>
          </div>
          <div className={styles.module_details_status}>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('lid_status')}
            </StyledText>
            <Chip
              type="neutral"
              hasIcon={false}
              text={lidOpen || lidOpen == null ? t('open') : t('closed')}
            />
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
            <StyledText desktopStyle="bodyDefaultRegular">
              {targetTemp != null
                ? t('temperature', { temp: targetTemp })
                : t('deactivated')}
            </StyledText>
          </div>
          <div className={styles.module_details_status}>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('target_speed')}
            </StyledText>
            <StyledText desktopStyle="bodyDefaultRegular">
              {targetSpeed != null
                ? t('speed', { speed: targetSpeed })
                : t('idle')}
            </StyledText>
          </div>
          <div className={styles.module_details_status}>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('labware_latch')}
            </StyledText>
            <Chip
              type="neutral"
              hasIcon={false}
              text={
                latchOpen || latchOpen == null
                  ? t('open')
                  : t('closed_and_locked')
              }
            />
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
              type={engaged ? 'info' : 'neutral'}
              iconName="connection-status"
              text={engaged ? t('engaged') : t('disengaged')}
            />
          </div>
        </div>
      )
      break
    }
    case TEMPERATURE_MODULE_TYPE: {
      const { status, targetTemperature } = moduleState
      moduleDetails = (
        <div className={styles.module_details_status_container}>
          <div className={styles.module_details_status}>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t(status)}
            </StyledText>
            <StyledText desktopStyle="bodyDefaultRegular">
              {targetTemperature != null
                ? t('temperature', { temp: targetTemperature })
                : t('deactivated')}
            </StyledText>
          </div>
        </div>
      )
      break
    }
    case ABSORBANCE_READER_TYPE: {
      const { lidOpen, initialization } = moduleState
      moduleDetails = (
        <div className={styles.module_details_status_container}>
          <div className={styles.module_details_status}>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('lid_status')}
            </StyledText>
            <Chip
              type="neutral"
              hasIcon={false}
              text={lidOpen || lidOpen == null ? t('open') : t('closed')}
            />
          </div>
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
      //  TODO: add this in when the flex stacker module state is finalized for PD
      //   const {
      //     maxPoolCount,
      //     storedLabwareDetails,
      //     labwareInHopper,
      //     labwareOnShuttle,
      //   } = moduleState
      console.error(
        "TODO: update this when PD's flex stacker module state is finalized"
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
        <StyledText desktopStyle="bodyDefaultSemiBold">
          {moduleDisplayName}
        </StyledText>
        {moduleDetails}
      </div>
    </div>
  )
}
