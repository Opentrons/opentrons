import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import { Divider } from '@opentrons/components'
import { vacuumModuleStateGetter } from '@opentrons/step-generation'

import { DropdownStepFormField } from '/protocol-designer/components/molecules'
import { getMainPagePortalEl } from '/protocol-designer/components/organisms'
import { VacuumModeUpdateModal } from '/protocol-designer/components/organisms/VacuumModeUpdateModal'
import { useVacuumModeUpdate } from '/protocol-designer/components/organisms/VacuumModeUpdateModal/hooks/useVacuumModeUpdate'
import { getRobotStateAtActiveItem } from '/protocol-designer/top-selectors/labware-locations'
import { getVacuumLabwareOptions } from '/protocol-designer/ui/modules/selectors'
import { hoverSelection } from '/protocol-designer/ui/steps/actions/actions'

import { VacuumControls } from './VacuumControls'
import { VacuumModuleState } from './VacuumModuleState'
import styles from './vacuumtools.module.css'

import type { ReactNode } from 'react'
import type { FormData } from '/protocol-designer/form-types'
import type { FieldPropsByName } from '../../types'

interface VacuumToolsProps {
  formData: FormData
  propsForFields: FieldPropsByName
  showFormErrors: boolean
}

export function VacuumTools(props: VacuumToolsProps): ReactNode {
  const { formData, propsForFields, showFormErrors } = props
  const dispatch = useDispatch()
  const { t } = useTranslation(['form', 'protocol_steps'])
  const vacuumLabwareOptions = useSelector(getVacuumLabwareOptions)
  const robotState = useSelector(getRobotStateAtActiveItem)
  const vacuumModuleState =
    robotState != null
      ? vacuumModuleStateGetter(robotState, formData.moduleId as string)
      : null
  const vacuumModeUpdateResult = useVacuumModeUpdate(formData, propsForFields)
  const { showVacuumModeUpdateModal } = vacuumModeUpdateResult

  return (
    <>
      {createPortal(
        showVacuumModeUpdateModal ? (
          <VacuumModeUpdateModal
            onConfirm={vacuumModeUpdateResult.handleConfirmVacuumModeUpdate}
            onClose={vacuumModeUpdateResult.handleCancelVacuumModeUpdate}
          />
        ) : null,
        getMainPagePortalEl()
      )}
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
        <VacuumControls
          formData={formData}
          propsForFields={propsForFields}
          showFormErrors={showFormErrors}
        />
      </div>
    </>
  )
}
