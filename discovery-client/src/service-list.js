// @flow
import differenceBy from 'lodash/differenceBy'
import partition from 'lodash/partition'
import uniqBy from 'lodash/uniqBy'
import stableSort from 'stable'

import {
  clearServiceIfConflict,
  makeService,
  matchService,
  updateService,
} from './service'
import type { Service, ServiceList, ServiceUpdate } from './types'

export function createServiceList(list: ServiceList = []): ServiceList {
  // strip health flags from input list
  const nextList = list.map(s =>
    makeService(
      s.name,
      s.ip,
      s.port,
      null,
      null,
      null,
      s.health,
      s.serverHealth
    )
  )

  return dedupeServices(nextList)
}

export function upsertServiceList(
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

export function updateServiceListByIp(
  list: ServiceList,
  ip: string,
  update: ServiceUpdate
): ServiceList {
  const nextList = list.map(service =>
    service.ip === ip ? updateService(service, update) : service
  )

  return dedupeServices(nextList)
}

// ensure there aren't multiple entries with the same IP and there aren't
// multiple entries with the same name and ip: null
function dedupeServices(list: ServiceList) {
  const [listWithIp, listWithoutIp] = partition(list, 'ip')
  const sanitizedWithIp = listWithIp.reduce(
    (result, service) => {
      // we know IP exists here thanks to our partition above
      const ip: string = (service.ip: any)
      const cleanedService = result.seenIps[ip]
        ? clearServiceIfConflict(service, { ip })
        : service

      result.seenIps[ip] = true
      result.unique.push(cleanedService)

      return result
    },
    { unique: [], seenIps: {} }
  ).unique

  const dedupedWithoutIp = differenceBy(
    uniqBy(listWithoutIp, 'name'),
    sanitizedWithIp,
    'name'
  )

  // use a stable sort because core-js polyfills can mess with Array.sort order
  return stableSort(sanitizedWithIp.concat(dedupedWithoutIp), compareServices)
}

// sort service list by:
//   1. ip exists,
//   2. update server healthy
//   3. API healthy
//   4. link-local address
//   5. advertising
function compareServices(a: Service, b: Service) {
  if (a.ip && !b.ip) return -1
  if (!a.ip && b.ip) return 1
  if (a.serverOk && !b.serverOk) return -1
  if (!a.serverOk && b.serverOk) return 1
  if (a.ok && !b.ok) return -1
  if (!a.ok && b.ok) return 1
  if (a.local && !b.local) return -1
  if (!a.local && b.local) return 1
  if (a.advertising && !b.advertising) return -1
  if (!a.advertising && b.advertising) return 1
  return 0
}
