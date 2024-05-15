import React from 'react'
<<<<<<< HEAD
import { FormikConfig } from 'formik'
<<<<<<< HEAD
=======
>>>>>>> f3c86ff7d8 (fix(app, components, protocol-designer, shared-data): import type lint rule to error, fix occurrences (#15168))
import { vi, describe, it, beforeEach, afterEach } from 'vitest'
=======
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
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
<<<<<<< HEAD
      .calledWith(['loadName'], formikConfig.initialValues)
=======
      .calledWith(['pipetteName'], formikConfig.initialValues)
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
      .thenReturn(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render button when section is visible', () => {
    render(wrapInFormik(<Export onExportClick={onExportClick} />, formikConfig))

    screen.getByRole('button', { name: /export/i })
  })
<<<<<<< HEAD
=======

  it('should render alert when error is present', () => {
    const FAKE_ERROR = 'ahh'
    formikConfig.initialErrors = { pipetteName: FAKE_ERROR }
    formikConfig.initialTouched = { pipetteName: true }
    render(wrapInFormik(<Export onExportClick={onExportClick} />, formikConfig))

    // TODO(IL, 2021-05-26): AlertItem should have role="alert", then we can `getByRole('alert', {name: FAKE_ERROR})`
    screen.getByText(FAKE_ERROR)
  })

  it('should render the tip rack button when tip rack is selected', () => {
    formikConfig.initialValues.labwareType = 'tipRack'
    render(wrapInFormik(<Export onExportClick={onExportClick} />, formikConfig))

    screen.getByRole('button', { name: /tip rack test guide/i })
  })

  it('should render the labware button when tip rack is not selected', () => {
    formikConfig.initialValues.labwareType = 'wellPlate'
    render(wrapInFormik(<Export onExportClick={onExportClick} />, formikConfig))

    screen.getByRole('button', { name: /labware test guide/i })
  })

  it('should not render when all of the fields are hidden', () => {
    when(vi.mocked(isEveryFieldHidden))
      .calledWith(['pipetteName'], formikConfig.initialValues)
      .thenReturn(true)

    const { container } = render(
      wrapInFormik(<Export onExportClick={onExportClick} />, formikConfig)
    )
    expect(container.firstChild).toBe(null)
  })
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
})
