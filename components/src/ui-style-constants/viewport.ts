// Note (kk:08/29/2023) Needed this in this ts file to avoid check-js errors on CI
export const ODD_VIEWPORT_STYLES = {
  width: '1024px',
  height: '600px',
} as const

const customViewports = {
  onDeviceDisplay: {
    name: 'Touchscreen',
    type: 'tablet',
    styles: ODD_VIEWPORT_STYLES,
  },
}

export const touchScreenViewport = {
  viewport: {
    viewports: customViewports,
    defaultViewport: 'onDeviceDisplay',
  },
}
