import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'

import { CameraTools } from '..'

import type { ComponentProps } from 'react'

vi.mock('/protocol-designer/components/molecules/TextAreaField/index', () => {
  return {
    TextAreaField: vi.fn(() => <div>mock TextAreaField</div>),
  }
})

const render = (props: ComponentProps<typeof CameraTools>) => {
  return renderWithProviders(<CameraTools {...props} />, {
    i18nInstance: i18n,
  })
}

describe('CameraTools', () => {
  let props: ComponentProps<typeof CameraTools>
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
    screen.getByText('Camera')
  })
})
