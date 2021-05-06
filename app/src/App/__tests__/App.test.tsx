import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { mount } from 'enzyme'
import { AppComponent } from '..'

import { Robots } from '../../pages/Robots'
import { Upload } from '../../pages/Upload'
import { Calibrate } from '../../pages/Calibrate'
import { Run } from '../../pages/Run'
import { More } from '../../pages/More'

import { ConnectPanel } from '../../pages/Robots/ConnectPanel'
import { UploadPanel } from '../../pages/Upload/UploadPanel'
import { CalibratePanel } from '../../pages/Calibrate/CalibratePanel'
import { RunPanel } from '../../pages/Run/RunPanel'
import { MorePanel } from '../../pages/More/MorePanel'

import { Navbar } from '../Navbar'
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
jest.mock('../../pages/Upload/UploadPanel', () => ({
  UploadPanel: () => <></>,
}))
jest.mock('../../pages/Calibrate/CalibratePanel', () => ({
  CalibratePanel: () => <></>,
}))
jest.mock('../../pages/Run/RunPanel', () => ({ RunPanel: () => <></> }))
jest.mock('../../pages/More/MorePanel', () => ({ MorePanel: () => <></> }))
jest.mock('../Navbar', () => ({ Navbar: () => <></> }))
jest.mock('../../organisms/Alerts', () => ({ Alerts: () => <></> }))

describe('top level App component', () => {
  const render = (url = '/') => {
    return mount(<AppComponent />, {
      wrappingComponent: MemoryRouter,
      wrappingComponentProps: { initialEntries: [url], initialIndex: 0 },
    })
  }

  it('should render a Navbar', () => {
    const wrapper = render()
    expect(wrapper.exists(Navbar)).toBe(true)
  })

  it('should render a Robots page on /robot', () => {
    const wrapper = render('/robots')
    expect(wrapper.exists(Robots)).toBe(true)
    expect(wrapper.exists(ConnectPanel)).toBe(true)
  })

  it('should render a Robots page on /robot/:robot-name', () => {
    const wrapper = render('/robots/some-name')
    expect(wrapper.exists(Robots)).toBe(true)
    expect(wrapper.exists(ConnectPanel)).toBe(true)
  })

  it('should render a More page on /more', () => {
    const wrapper = render('/more')
    expect(wrapper.exists(More)).toBe(true)
    expect(wrapper.exists(MorePanel)).toBe(true)
  })

  it('should render an Upload page on /upload', () => {
    const wrapper = render('/upload')
    expect(wrapper.exists(Upload)).toBe(true)
    expect(wrapper.exists(UploadPanel)).toBe(true)
  })

  it('should render a Calibrate page on /calibrate', () => {
    const wrapper = render('/calibrate')
    expect(wrapper.exists(Calibrate)).toBe(true)
    expect(wrapper.exists(CalibratePanel)).toBe(true)
  })

  it('should render a Run page on /run', () => {
    const wrapper = render('/run')
    expect(wrapper.exists(Run)).toBe(true)
    expect(wrapper.exists(RunPanel)).toBe(true)
  })

  it('should render a PortalRoot for modals', () => {
    const wrapper = render()
    expect(wrapper.exists(PortalRoot)).toBe(true)
  })

  it('should render a TopPortalRoot for top level modals', () => {
    const wrapper = render()
    expect(wrapper.exists(TopPortalRoot)).toBe(true)
  })

  it('should redirect to /robots from /', () => {
    const wrapper = render('/')
    expect(wrapper.exists(Robots)).toBe(true)
    expect(wrapper.exists(ConnectPanel)).toBe(true)
  })

  it('should render app-wide Alerts', () => {
    const wrapper = render()
    expect(wrapper.exists(Alerts)).toBe(true)
  })
})
