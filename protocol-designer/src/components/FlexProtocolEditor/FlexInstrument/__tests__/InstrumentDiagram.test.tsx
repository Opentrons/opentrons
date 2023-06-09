import * as React from 'react'
import { shallow } from 'enzyme'
import { InstrumentDiagram, InstrumentDiagramProps } from '../InstrumentDiagram'
import { render, screen } from '@testing-library/react'

describe('InstrumentDiagram', () => {
  it('Renders with single channel GEN2 pipette', () => {
    const props: InstrumentDiagramProps = {
      pipetteSpecs: { displayCategory: 'GEN2', channels: 1 },
      mount: 'left',
      className: 'test-class',
    }
    const wrapper = shallow(<InstrumentDiagram {...props} />)
    expect(wrapper.find('img').prop('src')).toEqual(
      'single-channel_GEN2_800px.png'
    )
    expect(wrapper.find('.test-class').exists()).toBeTruthy()
  })

  it('Renders with multi-channel GEN2 pipette', () => {
    const props: InstrumentDiagramProps = {
      pipetteSpecs: { displayCategory: 'GEN2', channels: 8 },
      mount: 'right',
      className: 'test-class',
    }
    const wrapper = shallow(<InstrumentDiagram {...props} />)
    expect(wrapper.find('img').prop('src')).toEqual(
      'multi-channel_GEN2_800px.png'
    )
    expect(wrapper.find('.test-class').exists()).toBeTruthy()
  })

  it('Renders with single channel GEN1 pipette', () => {
    const props: InstrumentDiagramProps = {
      pipetteSpecs: { displayCategory: 'GEN1', channels: 1 },
      mount: 'left',
      className: 'test-class',
    }
    const wrapper = shallow(<InstrumentDiagram {...props} />)
    expect(wrapper.find('img').prop('src')).toEqual(
      'single_channel_GEN1_800px.png'
    )
    expect(wrapper.find('.test-class').exists()).toBeTruthy()
  })

  it('Renders with multi-channel GEN1 pipette', () => {
    const props: InstrumentDiagramProps = {
      pipetteSpecs: { displayCategory: 'GEN1', channels: 8 },
      mount: 'right',
      className: 'test-class',
    }
    const wrapper = shallow(<InstrumentDiagram {...props} />)
    expect(wrapper.find('img').prop('src')).toEqual(
      'multi-channel_GEN1_800px.png'
    )
    expect(wrapper.find('.test-class').exists()).toBeTruthy()
  })

  it('renders InstrumentDiagram component with default GEN1 pipette when displayCategory prop is not provided', () => {
    const props: InstrumentDiagramProps = {
      // pipetteSpecs: { channels: 1 },
      mount: 'left',
      className: 'test-class',
    }
    render(<InstrumentDiagram {...props} />)
    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()
  })
})
