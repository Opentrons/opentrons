// @flow
import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { mount } from 'enzyme'
import { App } from '../App'

import { SidePanel } from '../../../pages/SidePanel'
import { Robots } from '../../../pages/Robots'
import { More } from '../../../pages/More'
import { Upload } from '../../../pages/Upload'
import { Calibrate } from '../../../pages/Calibrate'
import { Run } from '../../../pages/Run'
import { Navbar } from '../../Navbar'
import { PortalRoot } from '../../portal'
import { Alerts } from '../../Alerts'

jest.mock('../../../pages/SidePanel', () => ({ SidePanel: () => <></> }))
jest.mock('../../../pages/Robots', () => ({ Robots: () => <></> }))
jest.mock('../../../pages/Robots', () => ({ Robots: () => <></> }))
jest.mock('../../../pages/More', () => ({ More: () => <></> }))
jest.mock('../../../pages/Upload', () => ({ Upload: () => <></> }))
jest.mock('../../../pages/Calibrate', () => ({ Calibrate: () => <></> }))
jest.mock('../../../pages/Run', () => ({ Run: () => <></> }))
jest.mock('../../Navbar', () => ({ Navbar: () => <></> }))
jest.mock('../../Alerts', () => ({ Alerts: () => <></> }))

describe('top level App component', () => {
  const render = (url = '/') => {
    return mount(<App />, {
      wrappingComponent: MemoryRouter,
      wrappingComponentProps: { initialEntries: [url], initialIndex: 0 },
    })
  }

  it('should render a Navbar', () => {
    const wrapper = render()
    expect(wrapper.exists(Navbar)).toBe(true)
  })

  it('should render a SidePanel', () => {
    const wrapper = render()
    expect(wrapper.exists(SidePanel)).toBe(true)
  })

  it('should render a Robots page on /robot', () => {
    const wrapper = render('/robots')
    expect(wrapper.exists(Robots)).toBe(true)
  })

  it('should render a Robots page on /robot/:robot-name', () => {
    const wrapper = render('/robots/some-name')
    expect(wrapper.exists(Robots)).toBe(true)
  })

  it('should render a More page on /more', () => {
    const wrapper = render('/more')
    expect(wrapper.exists(More)).toBe(true)
  })

  it('should render an Upload page on /upload', () => {
    const wrapper = render('/upload')
    expect(wrapper.exists(Upload)).toBe(true)
  })

  it('should render a Calibrate page on /calibrate', () => {
    const wrapper = render('/calibrate')
    expect(wrapper.exists(Calibrate)).toBe(true)
  })

  it('should render a Run page on /run', () => {
    const wrapper = render('/run')
    expect(wrapper.exists(Run)).toBe(true)
  })

  it('should render a PortalRoot for modals', () => {
    const wrapper = render()
    expect(wrapper.exists(PortalRoot)).toBe(true)
  })

  it('should redirect to /robots from /', () => {
    const wrapper = render('/')
    expect(wrapper.exists(Robots)).toBe(true)
  })

  it('should render app-wide Alerts', () => {
    const wrapper = render()
    expect(wrapper.exists(Alerts)).toBe(true)
  })
})
