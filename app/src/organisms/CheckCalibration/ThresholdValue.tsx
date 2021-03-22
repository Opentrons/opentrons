import * as React from 'react'

interface Props {
  thresholdVector: [number, number, number]
}

export function ThresholdValue(props: Props): React.Node {
  const value = props.thresholdVector.find(axis => axis > 0)
  const formattedValue = parseFloat(value).toFixed(1)
  return <span>{`±${formattedValue} mm`}</span>
}
