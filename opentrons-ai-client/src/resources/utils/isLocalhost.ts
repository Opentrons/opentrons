/**
 * Checks if the current URL is localhost.
 * @returns {boolean} - Returns true if the hostname is 'localhost', '127.0.0.1', or starts with '192.168.'.
 */

export const isLocalhost = (): boolean => {
  const host = window.location.hostname
  return (
    host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.')
  )
}
