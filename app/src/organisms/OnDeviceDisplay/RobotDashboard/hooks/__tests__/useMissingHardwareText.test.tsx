import * as React from 'react'
import { I18nextProvider } from 'react-i18next'
import { renderHook } from '@testing-library/react-hooks'
import { i18n } from '../../../../../i18n'
import { useMissingHardwareText } from '..'

describe('useMissingHardwareText', () => {
  let wrapper: React.FunctionComponent<{}>
  beforeEach(() => {
    wrapper = ({ children }) => (
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    )
  })
  it('should return string for ready', () => {
    const { result } = renderHook(() => useMissingHardwareText([]), {
      wrapper,
    })
    expect(result.current).toEqual('Ready to run')
  })
  it('should return missing 1 module', () => {
    const { result } = renderHook(
      () =>
        useMissingHardwareText([
          {
            hardwareType: 'module',
            moduleModel: 'temperatureModuleV2',
            slot: '1',
            connected: false,
          },
        ]),
      {
        wrapper,
      }
    )
    expect(result.current).toEqual('Missing 1 module')
  })
  it('should return missing 2 modules', () => {
    const { result } = renderHook(
      () =>
        useMissingHardwareText([
          {
            hardwareType: 'module',
            moduleModel: 'temperatureModuleV2',
            slot: '1',
            connected: false,
          },
          {
            hardwareType: 'module',
            moduleModel: 'heaterShakerModuleV1',
            slot: '5',
            connected: false,
          },
        ]),
      {
        wrapper,
      }
    )
    expect(result.current).toEqual('Missing 2 modules')
  })
  it('should return missing 1 pipette', () => {
    const { result } = renderHook(
      () =>
        useMissingHardwareText([
          {
            hardwareType: 'pipette',
            pipetteName: 'p1000_96',
            mount: 'left',
            connected: false,
          },
        ]),
      {
        wrapper,
      }
    )
    expect(result.current).toEqual('Missing 1 pipette')
  })
  it('should return missing 2 pipettes', () => {
    const { result } = renderHook(
      () =>
        useMissingHardwareText([
          {
            hardwareType: 'pipette',
            pipetteName: 'p50_multi_flex',
            mount: 'left',
            connected: false,
          },
          {
            hardwareType: 'pipette',
            pipetteName: 'p1000_multi_flex',
            mount: 'right',
            connected: false,
          },
        ]),
      {
        wrapper,
      }
    )
    expect(result.current).toEqual('Missing 2 pipettes')
  })
  it('should return missing hardware', () => {
    const { result } = renderHook(
      () =>
        useMissingHardwareText([
          {
            hardwareType: 'pipette',
            pipetteName: 'p50_multi_flex',
            mount: 'left',
            connected: false,
          },
          {
            hardwareType: 'module',
            moduleModel: 'heaterShakerModuleV1',
            slot: '5',
            connected: false,
          },
        ]),
      {
        wrapper,
      }
    )
    expect(result.current).toEqual('Missing hardware')
  })
})
