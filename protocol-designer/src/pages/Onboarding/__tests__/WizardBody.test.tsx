import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'

import { WizardBody } from '../WizardBody'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof WizardBody>) => {
  return renderWithProviders(<WizardBody {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('WizardBody', () => {
  let props: ComponentProps<typeof WizardBody>

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

  it('renders all the elements', async () => {
    const user = userEvent.setup()
    render(props)
    screen.getByText('Step 1')
    screen.getByText('mockHeader')
    screen.getByText('mock children')
    screen.getByText('mockSubheader')
    await user.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(props.proceed).toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Go back' }))
    expect(props.goBack).toHaveBeenCalled()
    screen.getByLabelText('onboarding animation for page 1')
  })
})
