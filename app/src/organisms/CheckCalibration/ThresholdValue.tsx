import * as React from 'react'

interface Props {
  thresholdVector: [number, number, number]
}

export function ThresholdValue(props: Props): JSX.Element {
  const value = props.thresholdVector.find(axis => axis > 0)
  const formattedValue = parseFloat(String(value)).toFixed(1)
  return <span>{`±${formattedValue} mm`}</span>
}
