import * as React from 'react'
import { screen } from '@testing-library/react'
import { beforeEach, describe, it } from 'vitest'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { ErrorRecoveryHeader } from '../ErrorRecoveryHeader'
import { ERROR_KINDS } from '../constants'

const render = (props: React.ComponentProps<typeof ErrorRecoveryHeader>) => {
  return renderWithProviders(<ErrorRecoveryHeader {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ErrorRecoveryHeader', () => {
  let props: React.ComponentProps<typeof ErrorRecoveryHeader>

  beforeEach(() => {
    props = {
      errorKind: ERROR_KINDS.GENERAL_ERROR,
    }
  })

  it('renders appropriate copy independent of errorKind', () => {
    render(props)

    screen.getByText('Recovery Mode')
  })

  it('renders the appropriate header for a general error kind', () => {
    render(props)

    screen.getByText('General error')
  })
})
