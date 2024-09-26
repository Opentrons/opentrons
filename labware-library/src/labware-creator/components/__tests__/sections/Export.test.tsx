import { vi, describe, it, beforeEach, afterEach } from 'vitest'
import { when } from 'vitest-when'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { getDefaultFormState, getInitialStatus } from '../../../fields'
import { isEveryFieldHidden } from '../../../utils'
import { Export } from '../../sections/Export'
import { wrapInFormik } from '../../utils/wrapInFormik'
import type { FormikConfig } from 'formik'
import type { LabwareFields } from '../../../fields'

vi.mock('../../../utils')

let formikConfig: FormikConfig<LabwareFields>
let onExportClick: (e: any) => unknown

describe('Export', () => {
  beforeEach(() => {
    formikConfig = {
      initialStatus: getInitialStatus(),
      initialValues: getDefaultFormState(),
      onSubmit: vi.fn(),
    }

    onExportClick = vi.fn()

    when(vi.mocked(isEveryFieldHidden))
      .calledWith(['loadName'], formikConfig.initialValues)
      .thenReturn(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render button when section is visible', () => {
    render(
      wrapInFormik(
        <Export
          onExportClick={onExportClick}
          isOnRunApp={false}
          disabled={false}
        />,
        formikConfig
      )
    )

    screen.getByRole('button', { name: /export/i })
  })
})
