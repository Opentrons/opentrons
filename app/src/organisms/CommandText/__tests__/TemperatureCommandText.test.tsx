import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { TemperatureCommandText } from '../TemperatureCommandText'


describe('TemperatureCommandText', () => {
  it('renders correct text for temperatureModule/setTargetTemperature', () => {
    const mockTemp = 20
    const { getByText } = renderWithProviders(
      <TemperatureCommandText
        command={{
          commandType: 'temperatureModule/setTargetTemperature',
          params: { celsius: mockTemp, moduleId: 'abc123' },
          id: 'def456',
          result: {},
          status: 'queued',
          error: null,
          createdAt: 'fake_timestamp',
          startedAt: null,
          completedAt: null,
        }}
      />,
      {
        i18nInstance: i18n,
      })[0]
    getByText('Setting Temperature Module to 20°C (rounded to nearest integer)')
  })
  it('renders correct text for temperatureModule/waitForTemperature', () => {
    const mockTemp = 20
    const { getByText } = renderWithProviders(
      <TemperatureCommandText
        command={{
          commandType: 'temperatureModule/waitForTemperature',
          params: { celsius: mockTemp, moduleId: 'abc123' },
          id: 'def456',
          result: {},
          status: 'queued',
          error: null,
          createdAt: 'fake_timestamp',
          startedAt: null,
          completedAt: null,
        }}
      />,
      {
        i18nInstance: i18n,
      })[0]
    getByText('Waiting for Temperature Module to reach 20°C (rounded to nearest integer)')
  })
  it('renders correct text for thermocycler/setTargetBlockTemperature', () => {
    const mockTemp = 20
    const { getByText } = renderWithProviders(
      <TemperatureCommandText
        command={{
          commandType: 'thermocycler/setTargetBlockTemperature',
          params: { celsius: mockTemp, moduleId: 'abc123' },
          id: 'def456',
          result: {},
          status: 'queued',
          error: null,
          createdAt: 'fake_timestamp',
          startedAt: null,
          completedAt: null,
        }}
      />,
      {
        i18nInstance: i18n,
      })[0]
    getByText('Setting Thermocycler block temperature to 20°C')
  })
 it('renders correct text for thermocycler/setTargetLidTemperature', () => {
    const mockTemp = 20
    const { getByText } = renderWithProviders(
      <TemperatureCommandText
        command={{
          commandType: 'thermocycler/setTargetLidTemperature',
          params: { celsius: mockTemp, moduleId: 'abc123' },
          id: 'def456',
          result: {},
          status: 'queued',
          error: null,
          createdAt: 'fake_timestamp',
          startedAt: null,
          completedAt: null,
        }}
      />,
      {
        i18nInstance: i18n,
      })[0]
    getByText('Setting Thermocycler lid temperature to 20°C')
  })
  it('renders correct text for heaterShaker/setTargetTemperature', () => {
    const mockTemp = 20
    const { getByText } = renderWithProviders(
      <TemperatureCommandText
        command={{
          commandType: 'heaterShaker/setTargetTemperature',
          params: { celsius: mockTemp, moduleId: 'abc123' },
          id: 'def456',
          result: {},
          status: 'queued',
          error: null,
          createdAt: 'fake_timestamp',
          startedAt: null,
          completedAt: null,
        }}
      />,
      {
        i18nInstance: i18n,
      })[0]
    getByText('Setting Target Temperature of Heater-Shaker to 20°C')
  })
})

