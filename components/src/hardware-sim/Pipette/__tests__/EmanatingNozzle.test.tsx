import * as React from 'react'
import { render } from '@testing-library/react'
import { C_SELECTED_DARK, C_TRANSPARENT } from '../../../styles'
import { EmanatingNozzle } from '../EmanatingNozzle'
import { SINGLE_CHANNEL_PIPETTE_HEIGHT } from '../constants'

describe('EmanatingNozzle', () => {
  it('should render an small origin circle', () => {
    const { getByTestId } = render(
      <svg>
        <EmanatingNozzle cx={5} cy={10} />
      </svg>
    )
    const originCircle = getByTestId('origin_circle')
    expect(originCircle).toHaveAttribute('cx', '5')
    expect(originCircle).toHaveAttribute('cy', '10')
    expect(originCircle).toHaveAttribute('r', '0.5')
    expect(originCircle).toHaveAttribute('stroke', C_SELECTED_DARK)
    expect(originCircle).toHaveAttribute('fill', C_SELECTED_DARK)
  })
  it('should render a medium sized animating circle', () => {
    const { getByTestId } = render(
      <svg>
        <EmanatingNozzle cx={5} cy={10} />
      </svg>
    )
    const emanatingCircle = getByTestId('emanating_circle')
    expect(emanatingCircle).toHaveAttribute('cx', '5')
    expect(emanatingCircle).toHaveAttribute('cy', '10')
    expect(emanatingCircle).toHaveAttribute('r', '0.5')
    expect(emanatingCircle).toHaveAttribute('stroke', C_SELECTED_DARK)
    expect(emanatingCircle).toHaveAttribute('fill', C_TRANSPARENT)
  })
  it('should render a medium sized animating circle that grows', () => {
    const { getByTestId } = render(
      <svg>
        <EmanatingNozzle cx={5} cy={10} />
      </svg>
    )
    const radiusAnimation = getByTestId('radius_animation')
    expect(radiusAnimation).toHaveAttribute('attributeName', 'r')
    expect(radiusAnimation).toHaveAttribute('from', '5')
    expect(radiusAnimation).toHaveAttribute(
      'to',
      (SINGLE_CHANNEL_PIPETTE_HEIGHT / 2).toString()
    )
    expect(radiusAnimation).toHaveAttribute('begin', '0')
    expect(radiusAnimation).toHaveAttribute('dur', '1.1')
    expect(radiusAnimation).toHaveAttribute('calcMode', 'ease-out')
    expect(radiusAnimation).toHaveAttribute('repeatCount', 'indefinite')
  })
  it('should render a medium sized animating circle that fades out', () => {
    const { getByTestId } = render(
      <svg>
        <EmanatingNozzle cx={5} cy={10} />
      </svg>
    )
    const opacityAnimation = getByTestId('opacity_animation')
    expect(opacityAnimation).toHaveAttribute('attributeName', 'opacity')
    expect(opacityAnimation).toHaveAttribute('from', '0.7')
    expect(opacityAnimation).toHaveAttribute('to', '0')
    expect(opacityAnimation).toHaveAttribute('begin', '0')
    expect(opacityAnimation).toHaveAttribute('dur', '1.1')
    expect(opacityAnimation).toHaveAttribute('calcMode', 'linear')
    expect(opacityAnimation).toHaveAttribute('repeatCount', 'indefinite')
  })
})
