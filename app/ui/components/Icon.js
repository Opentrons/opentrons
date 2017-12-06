// SVG icon component
import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

export const USB = 'usb'
export const REFRESH = 'refresh'

const ICON_DATA_BY_NAME = {
  [USB]: {
    viewBox: '0 0 78 107',
    path: 'M41.5 70.147v11.48c5.223 1.687 9 6.589 9 12.373 0 7.18-5.82 13-13 13s-13-5.82-13-13c0-5.784 3.777-10.686 9-12.373v-.273h-.004c0-3.882-2.952-6.329-12.164-10.74l-.853-.41c-5.226-2.502-7.718-3.871-10.179-5.867-3.636-2.948-5.675-6.49-5.675-10.837v-5.433a8.5 8.5 0 1 1 8-.133V53.5c0 3.177 2.7 5.367 11.31 9.49l.853.408c4.094 1.961 6.61 3.278 8.712 4.722V20H25L37 0l12 20h-7.5v38.663c2.24-1.144 4.866-1.98 9.364-3.19l.943-.254.933-.253c10.106-2.757 13.387-5.193 13.387-11.55V37H61V20h17v17h-3.873v6.416c0 6.113-2.35 10.74-6.72 13.983-3.138 2.329-6.587 3.655-12.561 5.285l-.959.26-.944.253c-8.414 2.266-11.093 3.744-11.443 6.95z'
  },
  [REFRESH]: {
    viewBox: '0 0 200 200',
    path: 'M121.9,31.3L129,4.6l56.7,56.7l-77.5,20.8c0,0,7.7-28.6,7.7-28.6c-5.7-1.8-11.7-2.7-17.9-2.7 c-33.5,0-60.8,27.3-60.8,60.8c0,33.5,27.3,60.8,60.8,60.8c26.5,0,50.5-17.7,58.1-43.1l22,6.7c-5.1,16.8-15.7,32-29.8,42.6 c-14.6,11-32,16.8-50.3,16.8c-46.2,0-83.8-37.6-83.8-83.8S51.8,27.9,98,27.9C106.1,27.9,114.1,29.1,121.9,31.3'
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
