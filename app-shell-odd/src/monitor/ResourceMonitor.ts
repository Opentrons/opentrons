import { exec } from 'child_process'
import { promises as fs } from 'fs'

import { createLogger } from '../log'
import { UI_INITIALIZED } from '../constants'

import type { Action, Dispatch } from '../types'

const PARENT_PROCESSES = [
  'opentrons-robot-server.service',
  'opentrons-robot-app.service',
] as const
const REPORTING_INTERVAL_MS = 3600000 // 1 hour
const MAX_CMD_STR_LENGTH = 100
const MAX_REPORTED_PROCESSES = 15

interface ProcessTreeNode {
  pid: number
  cmd: string
  children: ProcessTreeNode[]
}

interface ProcessDetails {
  name: string
  memRssMb: string
}

interface ResourceMonitorDetails {
  systemAvailMemMb: string
  systemUptimeHrs: string
  processesDetails: ProcessDetails[]
}

// TODO(jh 10-24-24): Add testing, making proper affordances for mocking fs.readFile.

// Scrapes system and select process resource metrics, reporting those metrics to the browser layer.
// Note that only MAX_REPORTED_PROCESSES are actually dispatched.
export class ResourceMonitor {
  private readonly monitoredProcesses: Set<string>
  private readonly log: ReturnType<typeof createLogger>
  private intervalId: NodeJS.Timeout | null

  constructor() {
    this.monitoredProcesses = new Set(PARENT_PROCESSES)
    this.log = createLogger('monitor')
    this.intervalId = null
  }

  start(dispatch: Dispatch): Dispatch {
    // Scrape and report metrics on an interval.
    const beginMonitor = (): void => {
      if (this.intervalId == null) {
        this.intervalId = setInterval(() => {
          this.getResourceDetails()
            .then(resourceDetails => {
              this.log.debug('resource monitor report', {
                resourceDetails,
              })
              this.dispatchResourceDetails(resourceDetails, dispatch)
            })
            .catch(error => {
              this.log.error('Error monitoring process: ', error)
            })
        }, REPORTING_INTERVAL_MS)
      } else {
        this.log.warn(
          'Attempted to start an already started instance of ResourceMonitor.'
        )
      }
    }

    return function handleAction(action: Action) {
      switch (action.type) {
        case UI_INITIALIZED:
          beginMonitor()
      }
    }
  }

  private dispatchResourceDetails(
    details: ResourceMonitorDetails,
    dispatch: Dispatch
  ): void {
    const { processesDetails, systemUptimeHrs, systemAvailMemMb } = details
    dispatch({
      type: 'analytics:RESOURCE_MONITOR_REPORT',
      payload: {
        systemUptimeHrs,
        systemAvailMemMb,
        processesDetails: processesDetails.slice(0, MAX_REPORTED_PROCESSES), // don't accidentally send too many items to mixpanel.
      },
    })
  }

  private getResourceDetails(): Promise<ResourceMonitorDetails> {
    return Promise.all([
      this.getSystemAvailableMemory(),
      this.getSystemUptimeHrs(),
      this.getProcessDetails(),
    ]).then(([systemAvailMemMb, systemUptimeHrs, processesDetails]) => ({
      systemAvailMemMb,
      systemUptimeHrs,
      processesDetails,
    }))
  }

  // Scrape system uptime from /proc/uptime.
  private getSystemUptimeHrs(): Promise<string> {
    return fs
      .readFile('/proc/uptime', 'utf8')
      .then(uptime => {
        // First value is uptime in seconds, second is idle time
        const uptimeSeconds = Math.floor(parseFloat(uptime.split(' ')[0]))
        return (uptimeSeconds / 3600).toFixed(2)
      })
      .catch(error => {
        throw new Error(
          `Failed to read system uptime: ${
            error instanceof Error ? error.message : String(error)
          }`
        )
      })
  }

  // Scrape system available memory from /proc/meminfo.
  private getSystemAvailableMemory(): Promise<string> {
    return fs
      .readFile('/proc/meminfo', 'utf8')
      .then(meminfo => {
        const match = meminfo.match(/MemAvailable:\s+(\d+)\s+kB/)
        if (match == null) {
          throw new Error('Could not find MemAvailable in meminfo file')
        } else {
          const memInKb = parseInt(match[1], 10)
          return (memInKb / 1024).toFixed(2)
        }
      })
      .catch(error => {
        throw new Error(
          `Failed to read available memory info: ${
            error instanceof Error ? error.message : String(error)
          }`
        )
      })
  }

  // Given parent process names, get metrics for parent and all spawned processes.
  private getProcessDetails(): Promise<ProcessDetails[]> {
    return Promise.all(
      Array.from(this.monitoredProcesses).map(parentProcess =>
        this.getProcessTree(parentProcess)
          .then(processTree => {
            if (processTree == null) {
              return []
            } else {
              return this.getProcessDetailsFlattened(processTree)
            }
          })
          .catch(error => {
            this.log.error('Failed to get process tree', {
              parentProcess,
              error,
            })
            return []
          })
      )
    ).then(detailsArrays => detailsArrays.flat())
  }

  private getProcessTree(
    parentProcess: string
  ): Promise<ProcessTreeNode | null> {
    return this.getProcessPid(parentProcess).then(parentPid => {
      if (parentPid == null) {
        return null
      } else {
        return this.buildProcessTree(parentPid)
      }
    })
  }

  private getProcessPid(serviceName: string): Promise<number | null> {
    return new Promise((resolve, reject) => {
      exec(`systemctl show ${serviceName} -p MainPID`, (error, stdout) => {
        if (error != null) {
          reject(
            new Error(`Failed to get PID for ${serviceName}: ${error.message}`)
          )
        } else {
          const match = stdout.match(/MainPID=(\d+)/)

          if (match == null) {
            resolve(null)
          } else {
            const pid = parseInt(match[1], 10)
            resolve(pid > 1 ? pid : null)
          }
        }
      })
    })
  }

  // Recursively build the process tree, scraping the cmdline string for each pid.
  private buildProcessTree(pid: number): Promise<ProcessTreeNode> {
    return Promise.all([
      this.getProcessCmdline(pid),
      this.getChildProcessesFrom(pid),
    ]).then(([cmd, childPids]) => {
      return Promise.all(
        childPids.map(childPid => this.buildProcessTree(childPid))
      ).then(children => ({
        pid,
        cmd,
        children,
      }))
    })
  }

  // Get the exact cmdline string for the given pid, truncating if necessary.
  private getProcessCmdline(pid: number): Promise<string> {
    return fs
      .readFile(`/proc/${pid}/cmdline`, 'utf8')
      .then(cmdline => {
        const cmd = cmdline.replace(/\0/g, ' ').trim()
        return cmd.length > MAX_CMD_STR_LENGTH
          ? `${cmd.substring(0, MAX_CMD_STR_LENGTH)}...`
          : cmd
      })
      .catch(error => {
        this.log.error(`Failed to read cmdline for PID ${pid}`, error)
        return `PID ${pid}`
      })
  }

  private getChildProcessesFrom(parentPid: number): Promise<number[]> {
    return new Promise((resolve, reject) => {
      exec(`pgrep -P ${parentPid}`, (error, stdout) => {
        // code 1 means no children found
        if (error != null && error.code !== 1) {
          reject(error)
        } else {
          const children = stdout
            .trim()
            .split('\n')
            .filter(line => line.length > 0)
            .map(pid => parseInt(pid, 10))

          resolve(children)
        }
      })
    })
  }

  // Get the actual metric(s) for a given node and recursively get metric(s) for all child nodes.
  private getProcessDetailsFlattened(
    node: ProcessTreeNode
  ): Promise<ProcessDetails[]> {
    return this.getProcessMemory(node.pid).then(memRssMb => {
      const currentNodeDetails: ProcessDetails = {
        name: node.cmd,
        memRssMb,
      }

      return Promise.all(
        node.children.map(child => this.getProcessDetailsFlattened(child))
      ).then(childDetailsArrays => {
        return [currentNodeDetails, ...childDetailsArrays.flat()]
      })
    })
  }

  // Scrape VmRSS from /proc/pid/status for a given pid.
  private getProcessMemory(pid: number): Promise<string> {
    return fs
      .readFile(`/proc/${pid}/status`, 'utf8')
      .then(status => {
        const match = status.match(/VmRSS:\s+(\d+)\s+kB/)
        if (match == null) {
          throw new Error('Could not find VmRSS in status file')
        } else {
          const memInKb = parseInt(match[1], 10)
          return (memInKb / 1024).toFixed(2)
        }
      })
      .catch(error => {
        throw new Error(
          `Failed to read memory info for PID ${pid}: ${error.message}`
        )
      })
  }
}
