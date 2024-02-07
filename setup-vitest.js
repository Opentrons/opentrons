import '@testing-library/jest-dom/vitest'

let portalRoot = document.getElementById("portal")
if (!portalRoot) {
  portalRoot = document.createElement('div')
  portalRoot.setAttribute('id', 'top-portal-root')
  document.body.appendChild(portalRoot)
}