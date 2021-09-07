'use strict'

global._PKG_VERSION_ = '0.0.0-test'

// electron and native stuff that will break in unit tests
jest.mock('electron')
jest.mock('electron-updater')
jest.mock('electron-store')

jest.mock('../components/src/deck/getDeckDefinitions')

jest.mock('../app/src/assets/labware/getLabware')
jest.mock('../app/src/logger')
jest.mock('../app/src/App/portal')
jest.mock('../app/src/redux/shell/remote')
jest.mock('../app-shell/src/config')
jest.mock('../app-shell/src/log')

jest.mock('../protocol-designer/src/labware-defs/utils')
jest.mock('../protocol-designer/src/components/portals/MainPageModalPortal')

jest.mock('typeface-open-sans', () => {})
