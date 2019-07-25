// @flow
// set the public path at runtime according to deploy location
// side-effects to make sure public path is set before other imports

if (
  typeof global.__webpack_public_path__ === 'undefined' ||
  global.__webpack_public_path__ === '/'
) {
  if (location.hostname.startsWith('sandbox')) {
    // if we're serving from sandbox, ensure the public path is set to name
    // of the deploy folder
    const basePath = location.pathname.slice(1).split('/')[0] || ''
    global.__webpack_public_path__ = `/${basePath}/`
  } else {
    global.__webpack_public_path__ = '/'
  }
}

export function getPublicPath() {
  return global.__webpack_public_path__
}
