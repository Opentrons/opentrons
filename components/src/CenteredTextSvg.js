// @flow
import * as React from 'react'

type CenteredTextSvgProps = {
  text: string,
  className?: string
}

export function CenteredTextSvg (props: CenteredTextSvgProps) {
  const { text, className } = props
  return (
    <text x='50%' y='50%' textAnchor='middle' {...{className}}>
      {text}
    </text>
  )
}
