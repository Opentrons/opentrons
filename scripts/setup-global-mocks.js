'use strict'

console.log('setting up global mocks')
// electron and native stuff that will break in unit tests
jest.mock('electron')
jest.mock('electron-updater')
jest.mock('electron-store')

jest.mock('../components/src/deck/getDeckDefinitions')
jest.mock('@opentrons/components/src/deck/getDeckDefinitions')

jest.mock('../app/src/getLabware')
jest.mock('@opentrons/app/src/getLabware')
jest.mock('../app/src/logger')
jest.mock('../app/src/components/portal')
jest.mock('../app/src/shell/remote')
jest.mock('../app-shell/src/config')
jest.mock('../app-shell/src/log')

jest.mock('../protocol-designer/src/labware-defs/utils.js')
jest.mock('../protocol-designer/src/components/portals/MainPageModalPortal.js')

jest.mock('typeface-open-sans', () => {})
