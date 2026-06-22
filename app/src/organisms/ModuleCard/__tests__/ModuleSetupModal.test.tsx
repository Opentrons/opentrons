import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ABSORBANCE_READER_V1,
  FLEX_STACKER_MODULE_V1,
  TEMPERATURE_MODULE_V2,
} from '@opentrons/shared-data'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { ModuleSetupModal } from '../ModuleSetupModal'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof ModuleSetupModal>) => {
  return renderWithProviders(<ModuleSetupModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ModuleSetupModal', () => {
  let props: ComponentProps<typeof ModuleSetupModal>
  beforeEach(() => {
    props = {
      close: vi.fn(),
      moduleDisplayName: 'mockModuleDisplayName',
      moduleModel: TEMPERATURE_MODULE_V2,
    }
  })

  it('should render the correct header', () => {
    render(props)
    screen.getByRole('heading', {
      name: 'mockModuleDisplayName Setup Instructions',
    })
  })
  it('should render the correct body', () => {
    render(props)
    screen.getByText(
      'Follow the step-by-step setup instructions in the module’s manual. Scan the QR code or click the link below to view it on the Opentrons documentation website.'
    )
  })
  it('should render a link to the learn more page', () => {
    render(props)
    expect(
      screen
        .getByRole('link', {
          name: 'mockModuleDisplayName setup instructions',
        })
        .getAttribute('href')
    ).toBe('https://docs.opentrons.com/temperature-module/')
  })
  it('should call close when the close button is pressed', () => {
    render(props)
    expect(props.close).not.toHaveBeenCalled()
    const closeButton = screen.getByRole('button', { name: 'Close' })
    fireEvent.click(closeButton)
    expect(props.close).toHaveBeenCalled()
  })
  it('should render variable copy and link if absorbance reader', () => {
    props = {
      ...props,
      moduleModel: ABSORBANCE_READER_V1,
    }
    render(props)
    screen.getByText(
      'Follow the step-by-step setup instructions in the module’s manual. Scan the QR code or click the link below to view it on the Opentrons documentation website.'
    )
    expect(
      screen
        .getByRole('link', {
          name: 'mockModuleDisplayName setup instructions',
        })
        .getAttribute('href')
    ).toBe('https://docs.opentrons.com/absorbance-plate-reader/')
  })
  it('should render variable copy and link if flex stacker', () => {
    props = {
      ...props,
      moduleModel: FLEX_STACKER_MODULE_V1,
    }
    render(props)
    screen.getByText(
      'Follow the step-by-step setup instructions in the module’s manual. Scan the QR code or click the link below to view it on the Opentrons documentation website.'
    )
    expect(
      screen
        .getByRole('link', {
          name: 'mockModuleDisplayName setup instructions',
        })
        .getAttribute('href')
    ).toBe('https://docs.opentrons.com/stacker/')
  })
})
