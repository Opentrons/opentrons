import * as React from 'react'
import { useSelector } from 'react-redux'
import { i18n } from '../../../../localization'
import { getHeaterShakerLabwareOptions } from '../../../../ui/modules/selectors'
import { StepFormDropdown } from '../../fields'
import styles from '../../StepEditForm.css'
import type { StepFormProps } from '../../types'

export const HeaterShakerForm = (props: StepFormProps): JSX.Element | null => {
  const moduleLabwareOptions = useSelector(getHeaterShakerLabwareOptions)
  const { propsForFields } = props
  return (
    <div>
      <span className={styles.section_header_text}>
        {i18n.t('application.stepType.heaterShaker')}
      </span>
      <StepFormDropdown
        options={moduleLabwareOptions}
        {...propsForFields.moduleId}
      />
    </div>
  )
}
