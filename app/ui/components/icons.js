// icon components
import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

import styles from './icons.css'
import spinnerSrc from '../img/loading.gif'
import discoverSrc from '../img/icon_discover.png'
import controlledUSBSrc from '../img/icon_usb_controlled.png'
import controlledWifiSrc from '../img/icon_wifi_controlled.png'
import availableUSBSrc from '../img/icon_usb.png'
import availableWifiSrc from '../img/icon_wifi.png'

export function Spinner (props) {
  return (
    <ImageIcon {...props} src={spinnerSrc} />
  )
}

export function Discover (props) {
  return (
    <ImageIcon {...props} src={discoverSrc} />
  )
}

export function ControlledUSB (props) {
  return (
    <ImageIcon {...props} src={controlledUSBSrc} />
  )
}

export function ControlledWifi (props) {
  return (
    <ImageIcon {...props} src={controlledWifiSrc} />
  )
}

export function AvailableUSB (props) {
  return (
    <ImageIcon {...props} src={availableUSBSrc} />
  )
}

export function AvailableWifi (props) {
  return (
    <ImageIcon {...props} src={availableWifiSrc} />
  )
}

export function Success (props) {
  const style = classnames(styles.circle, styles.success, props.className)

  return (
    <TextIcon {...props} className={style} />
  )
}

export function Warning (props) {
  const style = classnames(styles.circle, styles.warning, props.className)

  return (
    <TextIcon {...props} className={style} />
  )
}

ImageIcon.propTypes = {
  src: PropTypes.string.isRequired
}

// TODO(mc, 2017-10-13): img based icons are slightly unsemantic
// switch to an SVG based model if possible
function ImageIcon (props) {
  return (
    <img {...props} aria-hidden='true' />
  )
}

function TextIcon (props) {
  return (
    <span {...props} aria-hidden='true' />
  )
}
