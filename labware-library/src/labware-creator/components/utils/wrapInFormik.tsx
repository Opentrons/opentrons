import { Formik, FormikConfig } from 'formik'
import * as React from 'react'

/**
 * Wraps a component in <Formik /> so it can be unit tested in isolation
 * @param component Component to wrap
 * @param formikConfig  Formik config to pass into <Formik />
 * @returns {JSX.Element}
 */
export const wrapInFormik = <Values,>(
  component: JSX.Element,
  formikConfig: FormikConfig<Values>
): JSX.Element => <Formik {...formikConfig}>{() => component}</Formik>
