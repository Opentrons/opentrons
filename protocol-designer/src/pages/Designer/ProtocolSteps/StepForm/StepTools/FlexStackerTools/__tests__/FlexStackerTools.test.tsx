import { ComponentProps } from 'react'
import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FLEX_STACKER_MODULE_TYPE } from '@opentrons/shared-data'

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
      robotState: {
        modules: {
          mockId: {
            moduleState: {
              type: FLEX_STACKER_MODULE_TYPE,
              maxPoolCount: 6,
              storedLabwareDetails: null,
              labwareInHopper: null,
              labwareOnShuttle: null,
            },
          },
        },
      } as any,
      flexStackerOptions: [{ name: 'mock module', value: 'mockId' }],
    }
  })

  it('should render view only', () => {
    render(props)
    expect(screen.getByText('Choose option')).toBeInTheDocument()
    expect(screen.getByText('Shuttle')).toBeInTheDocument()
    expect(screen.getByText('Stacker')).toBeInTheDocument()
    expect(screen.getByText('Module controls')).toBeInTheDocument()
    expect(screen.getByText('Refill')).toBeInTheDocument()
    const retrieveButton = screen.getByRole('radio', { name: 'retrieve' })
    expect(retrieveButton).toHaveAttribute('aria-disabled')
    expect(screen.getByText('Empty')).toBeInTheDocument()
  })
})
