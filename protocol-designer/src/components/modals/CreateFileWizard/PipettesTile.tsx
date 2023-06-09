import * as React from 'react'
import { DIRECTION_COLUMN, Flex, Text, SPACING, RadioGroup } from '@opentrons/components'
import { i18n } from '../../../localization'
import { FormikProps } from 'formik'

import type { FormState } from './types'
import { PipetteFields } from '../FilePipettesModal/PipetteFields'
import { RadioGroupField } from '../../StepEditForm/fields'

export function PipettesTile(props: FormikProps<FormState>): JSX.Element {
  const { handleChange, handleBlur, values, setFieldValue, errors, touched, setFieldTouched } = props
  return (
    <Flex flexDirection={DIRECTION_COLUMN} height='32rem' gridGap={SPACING.spacing32}>
      <Text as='h2'>
        {i18n.t('modal.create_file_wizard.pipettes')}
      </Text>

      {/* <PipetteFields
        values={values.pipettesByMount}
        onFieldChange={handleChange}
        onSetFieldValue={setFieldValue}
        onBlur={handleBlur}
        errors={errors.pipettesByMount ?? null}
        touched={touched.pipettesByMount ?? null}
        onSetFieldTouched={setFieldTouched}
        robotType={values.fields.robotType}
      /> */}
      <RadioGroupField
        values={values.pipettesByMount}
        onFieldChange={handleChange}
        onSetFieldValue={setFieldValue}
        onBlur={handleBlur}
        errors={errors.pipettesByMount ?? null}
        touched={touched.pipettesByMount ?? null}
        onSetFieldTouched={setFieldTouched}
      />


    </Flex>
  )
}
