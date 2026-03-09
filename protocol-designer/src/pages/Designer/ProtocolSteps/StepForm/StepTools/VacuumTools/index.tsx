import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import { Divider } from '@opentrons/components'
import { vacuumModuleStateGetter } from '@opentrons/step-generation'

import { DropdownStepFormField } from '/protocol-designer/components/molecules'
import { getRobotStateAtActiveItem } from '/protocol-designer/top-selectors/labware-locations'
import { getVacuumLabwareOptions } from '/protocol-designer/ui/modules/selectors'
import { hoverSelection } from '/protocol-designer/ui/steps/actions/actions'

import { VacuumControls } from './VacuumControls'
import { VacuumModuleState } from './VacuumModuleState'
import styles from './vacuumtools.module.css'

import type { StepFormProps } from '../../types'

export function VacuumTools(props: StepFormProps): JSX.Element {
  const { formData, propsForFields } = props
  const dispatch = useDispatch()
  const { t } = useTranslation(['form', 'protocol_steps'])
  const vacuumLabwareOptions = useSelector(getVacuumLabwareOptions)
  const robotState = useSelector(getRobotStateAtActiveItem)
  const vacuumModuleState =
    robotState != null
      ? vacuumModuleStateGetter(robotState, formData.moduleId as string)
      : null
  return (
    <div className={styles.vacuum_tools_container}>
      <DropdownStepFormField
        {...propsForFields.moduleId}
        tooltipContent={null}
        width="100%"
        options={vacuumLabwareOptions}
        title={t('protocol_steps:module')}
        onEnter={(id: string) => {
          dispatch(hoverSelection({ id, text: t('select') }))
        }}
        onExit={() => {
          dispatch(hoverSelection({ id: null, text: null }))
        }}
      />
      <Divider marginY="0" />
      <VacuumModuleState vacuumModuleState={vacuumModuleState} />
      <Divider marginY="0" />
      <VacuumControls formData={formData} propsForFields={propsForFields} />
    </div>
  )
}
