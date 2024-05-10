import React from 'react'
import { screen, findByText } from '@testing-library/react'
import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest'
import { when } from 'vitest-when'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { IncompatibleModuleTakeover } from '../IncompatibleModuleTakeover'
import { IncompatibleModuleODDModalBody } from '../IncompatibleModuleODDModalBody'
import { IncompatibleModuleDesktopModalBody } from '../IncompatibleModuleDesktopModalBody'
import { useIncompatibleModulesAttached } from '../hooks'
import type { AttachedModule } from '@opentrons/api-client'
import {
  PortalRoot,
  TopPortalRoot,
  MODAL_PORTAL_ID,
  TOP_PORTAL_ID,
} from '../../../App/portal'
import * as Fixtures from '../__fixtures__'

vi.mock('../hooks')
vi.mock('../IncompatibleModuleODDModalBody')
vi.mock('../IncompatibleModuleDesktopModalBody')

const getRenderer = (incompatibleModules: AttachedModule[]) => {
  when(useIncompatibleModulesAttached)
    .calledWith(expect.anything())
    .thenReturn(incompatibleModules)
  vi.mocked(IncompatibleModuleODDModalBody).mockReturnValue(
    <div>TEST ELEMENT ODD</div>
  )
  vi.mocked(IncompatibleModuleDesktopModalBody).mockReturnValue(
    <div>TEST ELEMENT DESKTOP</div>
  )
  return (props: React.ComponentProps<typeof IncompatibleModuleTakeover>) => {
    const [rendered] = renderWithProviders(
      <>
        <PortalRoot />
        <TopPortalRoot />
        <IncompatibleModuleTakeover {...(props as any)} />
      </>,
      {
        i18nInstance: i18n,
      }
    )
    rendered.rerender(
      <>
        <PortalRoot />
        <TopPortalRoot />
        <IncompatibleModuleTakeover {...(props as any)} />
      </>
    )
    return rendered
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
  ;['desktop', 'odd'].forEach(target => {
    it(`should render nothing on ${target} when no incompatible modules are attached`, () => {
      getRenderer([])({ ...props, isOnDevice: target === 'odd' })
      expect(screen.findByTestId(TOP_PORTAL_ID)).resolves.toBeEmptyDOMElement()
      expect(
        screen.findByTestId(MODAL_PORTAL_ID)
      ).resolves.toBeEmptyDOMElement()
      expect(screen.queryByText(/TEST ELEMENT/)).toBeNull()
    })
  })

  it('should render the modal body on odd when incompatible modules are attached', async () => {
    getRenderer(Fixtures.oneIncompatibleModule as any)({
      ...props,
      isOnDevice: true,
    })
    const container = await screen.findByTestId(TOP_PORTAL_ID)
    await findByText(container, 'TEST ELEMENT ODD')
  })

  it('should render the modal body on desktop when incompatible modules are attached', async () => {
    getRenderer(Fixtures.oneIncompatibleModule as any)({
      ...props,
      isOnDevice: false,
    })
    const container = await screen.findByTestId(MODAL_PORTAL_ID)
    await findByText(container, 'TEST ELEMENT DESKTOP')
  })
})
