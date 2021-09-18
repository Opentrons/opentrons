import React from 'react'
import '@testing-library/jest-dom'
import { ModuleModel, ModuleType } from '@opentrons/shared-data'
import { ModuleInfo } from '../ModuleInfo'
import { renderWithProviders } from '@opentrons/components/__utils__'
import { i18n } from '../../../../../i18n'

const render = (props: React.ComponentProps<typeof ModuleInfo>) => {
  return renderWithProviders(<ModuleInfo {...props} />, {
    i18nInstance: i18n,
  })
}
const STUBBED_ORIENTATION_VALUE = 'left'
const mockTCModule = {
  labwareOffset: { x: 3, y: 3, z: 3 },
  moduleId: 'TCModuleId',
  model: 'thermocyclerModuleV1' as ModuleModel,
  type: 'thermocyclerModuleType' as ModuleType,
}

describe('ModuleInfo', () => {
  let props: React.ComponentProps<typeof ModuleInfo>
  beforeEach(() => {
    props = {
      moduleModel: mockTCModule.model,
      isAttached: false,
      usbPort: null,
      hubPort: null,
    }
  })

  it('should show module not connected', () => {
    const { getByText } = render(props)
    expect(getByText('Not connected')).toBeTruthy()
  })

  it('should show module connected and hub number', () => {
    props = { ...props, usbPort: 1, hubPort: 1, isAttached: true }
    const { getByText } = render(props)
    expect(getByText('Connected')).toBeTruthy()
    expect(getByText('USB Port 1 via hub')).toBeTruthy()
  })

  it('should show module connected and no USB number', () => {
    props = { ...props, usbPort: null, hubPort: null, isAttached: true }
    const { getByText } = render(props)
    expect(getByText('Connected')).toBeTruthy()
    expect(getByText('USB Port Connected')).toBeTruthy()
  })

  it('should show module connected and USB number', () => {
    props = { ...props, usbPort: 1, hubPort: null, isAttached: true }
    const { getByText } = render(props)
    expect(getByText('Connected')).toBeTruthy()
    expect(getByText('USB Port 1')).toBeTruthy()
  })
})
