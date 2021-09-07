import * as React from 'react'
import { mount } from 'enzyme'

import { AlertModal } from '@opentrons/components'
import { ProgressBar } from '../progress'
import { DownloadUpdateModal } from '../DownloadUpdateModal'

describe('DownloadUpdateModal', () => {
  const handleClose = jest.fn()

  const render = (error: string | null = null) => {
    return mount(
      <DownloadUpdateModal
        notNowButton={{ onClick: handleClose, children: 'not now' }}
        error={error}
        progress={50}
      />
    )
  }

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render an AlertModal with a heading', () => {
    const wrapper = render()
    const modal = wrapper.find(AlertModal)

    expect(modal.prop('heading')).toBe('Downloading Update')
  })

  it('should render a close button', () => {
    const wrapper = render()
    const button = wrapper.find('button')

    expect(button.text()).toMatch(/not now/)
    expect(handleClose).not.toHaveBeenCalled()
    button.invoke('onClick')?.({} as React.MouseEvent)
    expect(handleClose).toHaveBeenCalled()
  })

  it('should render a progress bar', () => {
    const wrapper = render()
    const progress = wrapper.find(ProgressBar)

    expect(progress.prop('progress')).toBe(50)
  })

  it('should render a different heading, an error message, and no progress bar on error', () => {
    const wrapper = render('oh no!')
    const modal = wrapper.find(AlertModal)

    expect(modal.prop('heading')).toBe('Download Error')
    expect(modal.html()).toContain('oh no!')
    expect(wrapper.exists(ProgressBar)).toBe(false)
  })
})
