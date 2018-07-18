// @flow
import * as React from 'react'

type CenteredTextSvgProps = {
  text: string,
  className?: string
}

export function CenteredTextSvg (props: CenteredTextSvgProps) {
  const { text, className } = props

  return (
    <text
      className={className}
      x='50%'
      y='50%'
      textAnchor='middle'
      dominantBaseline='middle'
    >
      {text}
    </text>
  )
}
