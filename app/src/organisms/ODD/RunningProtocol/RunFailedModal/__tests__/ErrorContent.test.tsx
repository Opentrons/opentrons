import { screen } from '@testing-library/react'
import { beforeEach, describe, it } from 'vitest'

import { RUN_STATUS_FAILED, RUN_STATUS_SUCCEEDED } from '@opentrons/api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { ErrorContent } from '../ErrorContent'

import type { ComponentProps } from 'react'
import type { RunCommandError } from '@opentrons/shared-data'

const render = (props: ComponentProps<typeof ErrorContent>) => {
  return renderWithProviders(<ErrorContent {...props} />, {
    i18nInstance: i18n,
  })
}

const singleError: RunCommandError = {
  id: 'd0245210-dfb9-4f1c-8ad0-3416b603a7ba',
  errorType: 'hardwareCommunicationError',
  isDefined: false,
  createdAt: '2023-04-09T21:41:51.333171+00:00',
  detail: 'Error with code 1000 (highest priority)',
  errorInfo: {},
  errorCode: '1000',
  wrappedErrors: [],
}

const multipleErrors: RunCommandError[] = [
  {
    id: 'd0245210-dfb9-4f1c-8ad0-3416b603a7ba',
    errorType: 'roboticsInteractionError',
    isDefined: false,
    createdAt: '2023-04-09T21:41:51.333171+00:00',
    detail: 'Error with code 2001 (second highest priortiy)',
    errorInfo: {},
    errorCode: '2001',
    wrappedErrors: [],
  },
  {
    id: 'd0245210-dfb9-4f1c-8ad0-3416b603a7bb',
    errorType: 'generalError',
    isDefined: false,
    createdAt: '2023-04-09T21:41:51.333171+00:00',
    detail: 'Error with code 4000 (lowest priority)',
    errorInfo: {},
    errorCode: '4000',
    wrappedErrors: [],
  },
]

describe('ErrorContent', () => {
  let props: ComponentProps<typeof ErrorContent>

  beforeEach(() => {
    props = {
      errors: [singleError],
      isSingleError: true,
      runStatus: RUN_STATUS_FAILED,
    }
  })

  it('renders single-error header and detail without code prefix', () => {
    render(props)
    screen.getByText('Error 1000: hardwareCommunicationError')
    screen.getByText('Error with code 1000 (highest priority)')
  })

  it('renders plural error count and error code prefixes when run failed', () => {
    props = {
      errors: multipleErrors,
      isSingleError: false,
      runStatus: RUN_STATUS_FAILED,
    }
    render(props)

    screen.getByText('2 errors')
    screen.getByText('2001: Error with code 2001 (second highest priortiy)')
    screen.getByText('4000: Error with code 4000 (lowest priority)')
  })

  it('renders warning count when run succeeded', () => {
    props = {
      errors: multipleErrors,
      isSingleError: false,
      runStatus: RUN_STATUS_SUCCEEDED,
    }
    render(props)

    screen.getByText('2 warnings')
  })
})
