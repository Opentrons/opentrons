// @flow
import {
  makeService,
  updateService,
  clearServiceIfConflict,
  matchService,
} from './service'

import type {Service, ServiceList, ServiceUpdate} from './types'

export function createServiceList (list: ServiceList = []): ServiceList {
  // strip health flags from input list
  const nextList = list.map(s => makeService(s.name, s.ip, s.port))

  return dedupeServices(nextList)
}

export function upsertServiceList (
  list: ServiceList,
  upsert: Service
): ServiceList {
  const previous: ?Service = list.find(matchService(upsert))
  let nextList = list
  if (!previous) nextList = nextList.concat(upsert)

  nextList = nextList.map(service => {
    // don't do anything if this is the added entry
    if (service === upsert) return service
    // else update previous entry if it exists
    if (service === previous) return updateService(service, upsert)
    // else return the service, clearing flags if it conflicts with the update
    return clearServiceIfConflict(service, upsert)
  })

  return dedupeServices(nextList)
}

export function updateServiceListByIp (
  list: ServiceList,
  ip: string,
  update: ServiceUpdate
): ServiceList {
  const nextList = list.map(
    service => (service.ip === ip ? updateService(service, update) : service)
  )

  return dedupeServices(nextList)
}

export function diffServiceLists (
  prev: ServiceList,
  next: ServiceList
): ServiceList {
  // TODO(mc, 2018-10-02): this could be _way_ more optimized but these lists
  // will never really get bigger than order of magnitude 10
  return next.filter(service => !prev.includes(service))
}

// ensure there aren't multiple entries with the same IP and there aren't
// multiple entries with the same name and ip: null
function dedupeServices (list: ServiceList) {
  const dedupeResult = list
    .slice()
    .sort(compareByIpExists)
    .reduce(
      (result, service) => {
        const {unique, seenIps, seenNames} = result
        const {name} = service
        const ip = service.ip && seenIps[service.ip] ? null : service.ip
        const cleanedService = service.ip === ip ? service : {...service, ip}

        if (ip || !seenNames[name]) unique.push(cleanedService)
        if (ip && !seenIps[ip]) seenIps[ip] = true
        if (!seenNames[name]) seenNames[name] = true

        return {unique, seenIps, seenNames}
      },
      {unique: [], seenIps: {}, seenNames: {}}
    )

  return dedupeResult.unique
}

function compareByIpExists (a: Service, b: Service) {
  if (a.ip && !b.ip) return -1
  if (!a.ip && b.ip) return 1
  return 0
}
