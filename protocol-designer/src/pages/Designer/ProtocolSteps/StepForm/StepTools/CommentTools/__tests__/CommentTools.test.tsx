import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { CommentTools } from '..'
import { renderWithProviders } from '../../../../../../../__testing-utils__'
import { i18n } from '../../../../../../../assets/localization'

import type { ComponentProps } from 'react'

vi.mock('../../../../../../../components/molecules/TextAreaField/index', () => {
  return {
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
