// TODO(IL, 2021-03-24): update jszip module so that it has its own type defs?
// @types/jszip is deprecated.

declare module 'jszip' {
  const JSZip: any
  // eslint-disable-next-line import/no-default-export
  export default JSZip
}
