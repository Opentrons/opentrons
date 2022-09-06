import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { GEN1, GEN2, LEFT, RIGHT } from '@opentrons/shared-data'
import { i18n } from '../../../i18n'
import { InstructionStep } from '../InstructionStep'

const render = (props: React.ComponentProps<typeof InstructionStep>) => {
  return renderWithProviders(<InstructionStep {...props} />, {
    i18nInstance: i18n,
  })[0]
}
describe('InstructionStep', () => {
  let props: React.ComponentProps<typeof InstructionStep>
  beforeEach(() => {
    props = {
      children: <div>children</div>,
      direction: 'attach',
      mount: LEFT,
      channels: 1,
      diagram: 'screws',
      displayCategory: GEN1,
    }
  })
  it('renders the correct image for attaching a gen 1 single channel screw on left mount', () => {
    const { getByText, getByAltText } = render(props)
    getByText('children')
    getByAltText('attach-left-single-GEN1-screws')
  })
  it('renders the correct image for attaching a gen 2 single channel tab on left mount', () => {
    props = {
      ...props,
      diagram: 'tab',
      displayCategory: GEN2,
    }
    const { getByText, getByAltText } = render(props)
    getByText('children')
    getByAltText('attach-left-single-GEN2-tab')
  })
  it('renders the correct image for detaching a gen 2 8 channel tab on right mount', () => {
    props = {
      ...props,
      direction: 'detach',
      mount: RIGHT,
      channels: 8,
      diagram: 'tab',
      displayCategory: GEN2,
    }
    const { getByText, getByAltText } = render(props)
    getByText('children')
    getByAltText('detach-right-multi-GEN2-tab')
  })
})
