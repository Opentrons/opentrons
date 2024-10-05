import type * as React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, screen } from '@testing-library/react'
import { i18n } from '../../../assets/localization'
import { renderWithProviders } from '../../../__testing-utils__'
import { WizardBody } from '../WizardBody'

const render = (props: React.ComponentProps<typeof WizardBody>) => {
  return renderWithProviders(<WizardBody {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('WizardBody', () => {
  let props: React.ComponentProps<typeof WizardBody>

  beforeEach(() => {
    props = {
      stepNumber: 1,
      header: 'mockHeader',
      children: <div>mock children</div>,
      proceed: vi.fn(),
      disabled: false,
      goBack: vi.fn(),
      subHeader: 'mockSubheader',
    }
  })

  it('renders all the elements', () => {
    render(props)
    screen.getByText('Step 1')
    screen.getByText('mockHeader')
    screen.getByText('mock children')
    screen.getByText('mockSubheader')
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(props.proceed).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }))
    expect(props.goBack).toHaveBeenCalled()
    screen.getByRole('img', { name: '' })
  })
})
