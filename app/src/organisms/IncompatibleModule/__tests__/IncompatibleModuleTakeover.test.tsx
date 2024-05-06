import React from 'react'
import { screen } from '@testing-library/react'
import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest'
import { when } from 'vitest-when'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { IncompatibleModuleTakeover } from '../IncompatibleModuleTakeover'
import { IncompatibleModuleODDModalBody } from '../IncompatibleModuleODDModalBody'
import { useIncompatibleModulesAttached } from '../hooks'
import type { AttachedModule } from '@opentrons/api-client'
import { PortalRoot, MODAL_PORTAL_ID } from '../../../App/portal'
import * as Fixtures from '../__fixtures__'

vi.mock('../hooks')
vi.mock('../IncompatibleModuleODDModalBody')

const getRenderer = (incompatibleModules: AttachedModule[]) => {
  when(useIncompatibleModulesAttached)
    .calledWith(expect.anything())
    .thenReturn(incompatibleModules)
  vi.mocked(IncompatibleModuleODDModalBody).mockReturnValue(
    <div>TEST ELEMENT</div>
  )
  return (props: React.ComponentProps<typeof IncompatibleModuleTakeover>) => {
    return renderWithProviders(
      <>
        <PortalRoot />
        <IncompatibleModuleTakeover {...(props as any)} />
      </>,
      {
        i18nInstance: i18n,
      }
    )[0]
  }
}

describe('IncompatibleModuleTakeover', () => {
  let props: React.ComponentProps<typeof IncompatibleModuleTakeover>
  beforeEach(() => {
    props = { isOnDevice: true }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render nothing when no incompatible modules are attached', () => {
    getRenderer([])(props)
    expect(screen.findByTestId(MODAL_PORTAL_ID)).resolves.toBeEmptyDOMElement()
  })

  it('should render the module body when incompatible modules are attached', async () => {
    getRenderer(Fixtures.oneIncompatibleModule as any)(props)
    const container = await screen.findByTestId(MODAL_PORTAL_ID)
    await screen.findByText('TEST ELEMENT', {}, { container })
  })
})
