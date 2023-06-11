import * as React from 'react'
import { DIRECTION_COLUMN, Flex, Text, SPACING } from '@opentrons/components'
import { i18n } from '../../../localization'
import { FormikProps } from 'formik'

import type { FormState } from './types'
import { ModuleFields } from '../FilePipettesModal/ModuleFields'

export function ModulesAndOtherTile(props: FormikProps<FormState>): JSX.Element {
  const {
    handleChange,
    handleBlur,
    values,
    setFieldValue,
    errors,
    touched,
    setFieldTouched,
  } = props
  return (
    <Flex flexDirection={DIRECTION_COLUMN} height='26rem' gridGap={SPACING.spacing32}>

      <Text as='h2'>
        {i18n.t('modal.create_file_wizard.additional_items')}
      </Text>
      <ModuleFields
        errors={errors.modulesByType ?? null}
        values={values.modulesByType}
        onFieldChange={handleChange}
        onSetFieldValue={setFieldValue}
        onBlur={handleBlur}
        touched={touched.modulesByType ?? null}
        onSetFieldTouched={setFieldTouched}
      />
      
    </Flex >
  )
}
