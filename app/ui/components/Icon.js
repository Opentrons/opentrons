// SVG icon component
import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

export const USB = 'usb'

const ICON_DATA_BY_NAME = {
  [USB]: {
    viewBox: '0 0 78 107',
    path: 'M41.5 70.147v11.48c5.223 1.687 9 6.589 9 12.373 0 7.18-5.82 13-13 13s-13-5.82-13-13c0-5.784 3.777-10.686 9-12.373v-.273h-.004c0-3.882-2.952-6.329-12.164-10.74l-.853-.41c-5.226-2.502-7.718-3.871-10.179-5.867-3.636-2.948-5.675-6.49-5.675-10.837v-5.433a8.5 8.5 0 1 1 8-.133V53.5c0 3.177 2.7 5.367 11.31 9.49l.853.408c4.094 1.961 6.61 3.278 8.712 4.722V20H25L37 0l12 20h-7.5v38.663c2.24-1.144 4.866-1.98 9.364-3.19l.943-.254.933-.253c10.106-2.757 13.387-5.193 13.387-11.55V37H61V20h17v17h-3.873v6.416c0 6.113-2.35 10.74-6.72 13.983-3.138 2.329-6.587 3.655-12.561 5.285l-.959.26-.944.253c-8.414 2.266-11.093 3.744-11.443 6.95z'
  }
}

Icon.propTypes = {
  name: PropTypes.oneOf(Object.keys(ICON_DATA_BY_NAME)).isRequired,
  className: PropTypes.string
}

export default function Icon (props) {
  const {viewBox, path} = ICON_DATA_BY_NAME[props.name]
  const className = classnames(props.className)

  return (
    <svg
      version='1.1'
      aria-hidden='true'
      viewBox={viewBox}
      className={className}
      fill='currentColor'
    >
      <path fillRule='evenodd' d={path} />
    </svg>
  )
}
