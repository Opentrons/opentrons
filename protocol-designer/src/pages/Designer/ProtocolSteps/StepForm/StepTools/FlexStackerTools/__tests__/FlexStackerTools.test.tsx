import { ComponentProps } from 'react'
import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'

import { FlexStackerTools } from '..'

const render = (props: ComponentProps<typeof FlexStackerTools>) => {
  return renderWithProviders(<FlexStackerTools {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('FlexStackerTools', () => {
  let props: ComponentProps<typeof FlexStackerTools>
  beforeEach(() => {
    props = {
      propsForFields: {} as any,
      formData: {} as any,
      toolboxStep: 0,
      showFormErrors: false,
      focusHandlers: {} as any,
      tab: 'aspirate',
      setTab: vi.fn(),
      setShowFormErrors: vi.fn(),
      robotState: null,
      flexStackerOptions: [],
    }
  })

  it('should render', () => {
    render(props)
    expect(screen.getByText('Flex Stacker')).toBeInTheDocument()
  })
})
