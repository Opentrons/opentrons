import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'

import { CommentTools } from '..'

import type { ComponentProps } from 'react'
import type { TextAreaField } from '@opentrons/components'

vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof TextAreaField>()
  return {
    ...actual,
    TextAreaField: vi.fn(() => <div>mock TextAreaField</div>),
  }
})

const render = (props: ComponentProps<typeof CommentTools>) => {
  return renderWithProviders(<CommentTools {...props} />, {
    i18nInstance: i18n,
  })
}

describe('CommentTools', () => {
  let props: ComponentProps<typeof CommentTools>
  beforeEach(() => {
    props = {
      propsForFields: {
        message: {
          disabled: false,
          errorToShow: null,
          name: 'message',
          value: null,
          tooltipContent: 'step_fields.defaults.message',
        },
      },
    } as any
  })

  it('renders text and text area field', () => {
    render(props)
    screen.getByText('Comment')
    screen.getByText('mock TextAreaField')
  })
})
