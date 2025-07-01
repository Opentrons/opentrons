import { Chip, Divider, StyledText } from '@opentrons/components'
import {
  getModuleDisplayName,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import styles from './preview.module.css'

import type { ModuleEntities, RobotState } from '@opentrons/step-generation'

interface ModuleSlotDetailsProps {
  moduleId: string
  moduleEntities: ModuleEntities
  moduleRobotState: RobotState['modules']
}
export function ModuleSlotDetails(props: ModuleSlotDetailsProps): JSX.Element {
  const { moduleId, moduleEntities, moduleRobotState } = props
  const { model } = moduleEntities[moduleId]
  const moduleName = getModuleDisplayName(model)
  const moduleState = moduleRobotState[moduleId].moduleState

  let moduleDetails = <div></div>
  switch (moduleState.type) {
    case THERMOCYCLER_MODULE_TYPE: {
      moduleDetails = (
        <div className={styles.module_details_status_container}>
          <div className={styles.module_details_status}>
            <StyledText desktopStyle="bodyDefaultRegular">
              Block temp status
            </StyledText>
            <Chip
              type="info"
              hasIcon={false}
              text={
                moduleState.blockTargetTemp != null
                  ? //  TODO: we can extend moduleState to know if its heating or cooling
                    `Heating ${moduleState.blockTargetTemp} °C`
                  : 'Deactivated'
              }
            />
          </div>
          <div className={styles.module_details_status}>
            <StyledText desktopStyle="bodyDefaultRegular">
              Lid temp status
            </StyledText>
            <Chip
              type="info"
              hasIcon={false}
              text={
                moduleState.lidTargetTemp != null
                  ? //  TODO: we can extend moduleState to know if its heating or cooling
                    `Heating ${moduleState.lidTargetTemp} °C`
                  : 'Deactivated'
              }
            />
          </div>
          <div className={styles.module_details_status}>
            <StyledText desktopStyle="bodyDefaultRegular">
              Lid status
            </StyledText>
            <StyledText desktopStyle="bodyDefaultRegular">
              {moduleState.lidOpen || moduleState.lidOpen == null
                ? 'Open'
                : 'Closed'}
            </StyledText>
          </div>
        </div>
      )
      break
    }
    default:
      moduleDetails = <div>TODO</div>
  }

  return (
    <>
      <div className={styles.detail_container}>
        <div className={styles.slot_details_active_step}>
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {moduleName}
          </StyledText>
        </div>
        <div>{moduleDetails}</div>
      </div>
      <Divider />
    </>
  )
}
