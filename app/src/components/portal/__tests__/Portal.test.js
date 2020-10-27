// @flow

import * as React from 'react'
import { mountWithStore } from '@opentrons/components/__utils__'

import type { State, Action } from '../../../types'

import { Portal } from '../index'

describe('Portal', () => {
  let render
  let pagePortalRoot
  let topPortalRoot

  beforeEach(() => {
    render = props => {
      // add a div with portal id to the global body
      pagePortalRoot = global.document.createElement('div')
      pagePortalRoot.setAttribute('id', '__otAppModalPortalRoot')
      topPortalRoot = global.document.createElement('div')
      topPortalRoot.setAttribute('id', '__otAppTopPortalRoot')
      const body = global.document.querySelector('body')
      body.appendChild(pagePortalRoot)
      body.appendChild(topPortalRoot)

      return mountWithStore<_, State, Action>(<Portal {...props} />)
    }
  })

  it('defaults to page modal if level prop not passed', () => {
    const contents = <div data-test="testContents">Hello</div>

    const { wrapper } = render({ children: contents })

    expect(wrapper.parent().props()['id']).toEqual(pagePortalRoot.id)
  })

  it('honors level prop', () => {
    const contents = <div data-test="testContents">Hello</div>

    const { wrapper } = render({ children: contents, level: 'top' })

    expect(wrapper.parent().props()['id']).toEqual(topPortalRoot.id)
  })
})
