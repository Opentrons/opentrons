'use strict'
const { vi } = require('vitest')

global._PKG_VERSION_ = '0.0.0-test'
global._OPENTRONS_PROJECT_ = 'robot-stack'
global._DEFAULT_ROBOT_UPDATE_SOURCE_CONFIG_SELECTION_ = 'OT2'

// electron and native stuff that will break in unit tests
vi.mock('electron')
vi.mock('electron-updater')
vi.mock('electron-store')

vi.mock('../components/src/hardware-sim/Deck/getDeckDefinitions')

vi.mock('../app/src/assets/labware/getLabware')
vi.mock('../app/src/pages/Labware/helpers/getAllDefs')
vi.mock('../app/src/logger')
vi.mock('../app/src/App/portal')
vi.mock('../app/src/redux/shell/remote')
vi.mock('../app/src/App/hacks')
vi.mock('../app-shell/src/config')
vi.mock('../app-shell/src/log')
vi.mock('../app-shell-odd/src/config')
vi.mock('../app-shell-odd/src/log')
vi.mock('../protocol-designer/src/labware-defs/utils')
vi.mock('../protocol-designer/src/components/portals/MainPageModalPortal')

vi.mock('typeface-open-sans', () => {})
vi.mock('@fontsource/dejavu-sans', () => {})
vi.mock('@fontsource/public-sans', () => {})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
