import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { when, resetAllWhenMocks } from 'jest-when'
import { mountWithProviders } from '@opentrons/components'
import { AppComponent } from '..'

import { Robots } from '../../pages/Robots'
import { Upload } from '../../pages/Upload'
import { Calibrate } from '../../pages/Calibrate'
import { Run } from '../../pages/Run'
import { More } from '../../pages/More'

import { ConnectPanel } from '../../pages/Robots/ConnectPanel'
import { CalibratePanel } from '../../pages/Calibrate/CalibratePanel'
import { RunPanel } from '../../pages/Run/RunPanel'
import { MorePanel } from '../../pages/More/MorePanel'

import { useFeatureFlag } from '../../redux/config'

import { Navbar } from '../Navbar'
import { NextGenApp } from '../NextGenApp'
import { TopPortalRoot, PortalRoot } from '../portal'
import { Alerts } from '../../organisms/Alerts'

jest.mock('../../pages/Robots', () => ({ Robots: () => <></> }))
jest.mock('../../pages/Upload', () => ({ Upload: () => <></> }))
jest.mock('../../pages/Calibrate', () => ({ Calibrate: () => <></> }))
jest.mock('../../pages/Run', () => ({ Run: () => <></> }))
jest.mock('../../pages/More', () => ({ More: () => <></> }))
jest.mock('../../pages/Robots/ConnectPanel', () => ({
  ConnectPanel: () => <></>,
}))
jest.mock('../../pages/Calibrate/CalibratePanel', () => ({
  CalibratePanel: () => <></>,
}))
jest.mock('../../pages/Run/RunPanel', () => ({ RunPanel: () => <></> }))
jest.mock('../../pages/More/MorePanel', () => ({ MorePanel: () => <></> }))
jest.mock('../Navbar', () => ({ Navbar: () => <></> }))
jest.mock('../NextGenApp', () => ({ NextGenApp: () => <></> }))
jest.mock('../../organisms/Alerts', () => ({ Alerts: () => <></> }))
jest.mock('../../redux/discovery')
jest.mock('../../redux/config')

const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<
  typeof useFeatureFlag
>

describe('top level App component', () => {
  const render = (url = '/') => {
    return mountWithProviders(
      <MemoryRouter initialEntries={[url]} initialIndex={0}>
        <AppComponent />,
      </MemoryRouter>
    )
  }

  beforeEach(() => {
    when(mockUseFeatureFlag)
      .calledWith('hierarchyReorganization')
      .mockReturnValue(false)
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should render a Navbar', () => {
    const { wrapper } = render()
    expect(wrapper.exists(Navbar)).toBe(true)
  })

  it('should render a Robots page on /robot', () => {
    const { wrapper } = render('/robots')
    expect(wrapper.exists(Robots)).toBe(true)
    expect(wrapper.exists(ConnectPanel)).toBe(true)
  })

  it('should render a Robots page on /robot/:robot-name', () => {
    const { wrapper } = render('/robots/some-name')
    expect(wrapper.exists(Robots)).toBe(true)
    expect(wrapper.exists(ConnectPanel)).toBe(true)
  })

  it('should render a More page on /more', () => {
    const { wrapper } = render('/more')
    expect(wrapper.exists(More)).toBe(true)
    expect(wrapper.exists(MorePanel)).toBe(true)
  })

  it('should render an Upload page on /upload', () => {
    const { wrapper } = render('/upload')
    expect(wrapper.exists(Upload)).toBe(true)
  })

  it('should render a Calibrate page on /calibrate', () => {
    const { wrapper } = render('/calibrate')
    expect(wrapper.exists(Calibrate)).toBe(true)
    expect(wrapper.exists(CalibratePanel)).toBe(true)
  })

  it('should render a Run page on /run', () => {
    const { wrapper } = render('/run')
    expect(wrapper.exists(Run)).toBe(true)
    expect(wrapper.exists(RunPanel)).toBe(true)
  })

  it('should render a PortalRoot for modals', () => {
    const { wrapper } = render()
    expect(wrapper.exists(PortalRoot)).toBe(true)
  })

  it('should render a TopPortalRoot for top level modals', () => {
    const { wrapper } = render()
    expect(wrapper.exists(TopPortalRoot)).toBe(true)
  })

  it('should redirect to /robots from /', () => {
    const { wrapper } = render('/')
    expect(wrapper.exists(Robots)).toBe(true)
    expect(wrapper.exists(ConnectPanel)).toBe(true)
  })

  it('should redirect to /more from /app-settings/feature-flags', () => {
    const { wrapper } = render('/app-settings/feature-flags')
    expect(wrapper.exists(More)).toBe(true)
    expect(wrapper.exists(MorePanel)).toBe(true)
  })

  it('should render app-wide Alerts', () => {
    const { wrapper } = render()
    expect(wrapper.exists(Alerts)).toBe(true)
  })

  it('should not render the Next Gen App when the Hierarchy Reorganization feature flag is off', () => {
    const { wrapper } = render()
    expect(wrapper.exists(NextGenApp)).toBe(false)
  })

  it('should render the Next Gen App when the Hierarchy Reorganization feature flag is on', () => {
    when(mockUseFeatureFlag)
      .calledWith('hierarchyReorganization')
      .mockReturnValue(true)

    const { wrapper } = render()
    expect(wrapper.exists(NextGenApp)).toBe(true)
  })
})
