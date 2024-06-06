// Note (kk:08/29/2023) Needed this in this ts file to avoid check-js errors on CI
const customViewports = {
  onDeviceDisplay: {
    name: 'Touchscreen',
    type: 'tablet',
    styles: {
      width: '1024px',
      height: '600px',
    },
  },
}

export const touchScreenViewport = {
  viewport: {
    viewports: customViewports,
    defaultViewport: 'onDeviceDisplay',
  },
}
