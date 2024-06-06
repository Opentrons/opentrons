// set the public path at runtime according to deploy location
// side-effects to make sure public path is set before other imports

let _publicPath = '/'
if (location.hostname.startsWith('sandbox')) {
  // if we're serving from sandbox, ensure the public path is set to name
  // of the deploy folder
  const basePath = location.pathname.slice(1).split('/')[0] || ''
  _publicPath = `/${basePath}/`
}

export function getPublicPath(): string {
  return _publicPath
}
