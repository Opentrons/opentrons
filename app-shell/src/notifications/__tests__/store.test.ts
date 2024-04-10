import { describe, it, expect, beforeEach } from 'vitest'

import { connectionStore } from '../store'

const MOCK_IP = 'MOCK_IP'
const MOCK_ROBOT = 'MOCK_ROBOT'
const MOCK_WINDOW = {} as any
const MOCK_CLIENT = { connected: true } as any
const MOCK_TOPIC = 'MOCK_TOPIC' as any

describe('ConnectionStore', () => {
  beforeEach(() => {
    connectionStore.clearStore()
  })

  describe('getBrowserWindow', () => {
    it('should return the browser window', () => {
      connectionStore.setBrowserWindow(MOCK_WINDOW)
      expect(connectionStore.getBrowserWindow()).toBe(MOCK_WINDOW)
    })
  })

  describe('getAllBrokersInStore', () => {
    it('should return an empty array if there are no brokers in the store', () => {
      expect(connectionStore.getAllBrokersInStore()).toEqual([])
    })

    it('should return an array of broker names in the store', async () => {
      await connectionStore.setPendingConnection(MOCK_ROBOT)
      await connectionStore.setPendingConnection('robot2')
      expect(connectionStore.getAllBrokersInStore()).toEqual([
        MOCK_ROBOT,
        'robot2',
      ])
    })
  })

  describe('getClient', () => {
    it('should return null if the given IP is not associated with a connection', () => {
      expect(connectionStore.getClient(MOCK_IP)).toBeNull()
    })

    it('should return the client if the given IP is associated with a connection', async () => {
      await connectionStore.setPendingConnection(MOCK_ROBOT)
      connectionStore.associateIPWithRobotName(MOCK_IP, MOCK_ROBOT)
      await connectionStore.setConnected(MOCK_ROBOT, MOCK_CLIENT)
      expect(connectionStore.getClient(MOCK_IP)).toBe(MOCK_CLIENT)
    })
  })

  describe('setErrorStatus and getFailedConnectionStatus', () => {
    it('should return null if the given IP is not associated with a connection', () => {
      expect(connectionStore.getFailedConnectionStatus(MOCK_IP)).toBeNull()
    })

    it('should return the unreachable status for the given IP', async () => {
      connectionStore.associateIPWithRobotName(MOCK_IP, MOCK_ROBOT)
      await connectionStore.setPendingConnection(MOCK_ROBOT)
      await connectionStore.setErrorStatus(MOCK_IP, 'ECONNFAILED')
      expect(connectionStore.getFailedConnectionStatus(MOCK_IP)).toBe(
        'ECONNFAILED'
      )
    })

    it('should return "ECONNFAILED" if the unreachable status for the given IP is "ECONNREFUSED" after the first error status check', async () => {
      connectionStore.associateIPWithRobotName(MOCK_IP, MOCK_ROBOT)
      await connectionStore.setPendingConnection(MOCK_ROBOT)
      await connectionStore.setErrorStatus(MOCK_IP, 'ECONNREFUSED')
      expect(connectionStore.getFailedConnectionStatus(MOCK_IP)).toBe(
        'ECONNREFUSED'
      )
      expect(connectionStore.getFailedConnectionStatus(MOCK_IP)).toBe(
        'ECONNFAILED'
      )
    })

    it('should throw an error if the given IP is not associated with a connection', async () => {
      await expect(
        connectionStore.setErrorStatus(MOCK_IP, 'Connection refused')
      ).rejects.toThrowError('MOCK_IP is not associated with a connection')
    })
  })

  describe('getRobotNameByIP', () => {
    it('should return null if the given IP is not associated with a connection', () => {
      expect(connectionStore.getRobotNameByIP(MOCK_IP)).toBeNull()
    })

    it('should return the robot name associated with the given IP', () => {
      connectionStore.associateIPWithRobotName(MOCK_IP, MOCK_ROBOT)
      expect(connectionStore.getRobotNameByIP(MOCK_IP)).toBe(MOCK_ROBOT)
    })
  })

  describe('setBrowserWindow', () => {
    it('should set the browser window', () => {
      connectionStore.setBrowserWindow(MOCK_WINDOW)
      expect(connectionStore.getBrowserWindow()).toBe(MOCK_WINDOW)
    })
  })

  describe('setPendingConnection', () => {
    it('should create a new connection if there is no connection currently connecting', async () => {
      await connectionStore.setPendingConnection(MOCK_ROBOT)
      expect(connectionStore.getAllBrokersInStore()).toEqual([MOCK_ROBOT])
    })

    it('should reject with an error if there is already a connection currently connecting', async () => {
      await expect(
        connectionStore.setPendingConnection(MOCK_ROBOT)
      ).resolves.toBeUndefined()
      await expect(
        connectionStore.setPendingConnection(MOCK_ROBOT)
      ).rejects.toThrowError(
        'Cannot create a new connection while currently connecting.'
      )
    })
  })

  describe('setConnected', () => {
    it('should set the client for the given robot name', async () => {
      connectionStore.setPendingConnection(MOCK_ROBOT)
      await connectionStore.setConnected(MOCK_ROBOT, MOCK_CLIENT)
      connectionStore.associateIPWithRobotName(MOCK_IP, MOCK_ROBOT)
      expect(connectionStore.getClient(MOCK_IP)).toBe(MOCK_CLIENT)
    })

    it('should reject with an error if there is already a connection for the given robot name', async () => {
      const MOCK_CLIENT_2 = {} as any
      await connectionStore.setPendingConnection(MOCK_ROBOT)
      await connectionStore.setConnected(MOCK_ROBOT, MOCK_CLIENT)
      connectionStore.associateIPWithRobotName(MOCK_IP, MOCK_ROBOT)
      await expect(
        connectionStore.setConnected(MOCK_ROBOT, MOCK_CLIENT_2)
      ).rejects.toThrowError('Connection already exists for MOCK_ROBOT')
    })

    it('should reject with an error if the given robot name is not associated with a connection', async () => {
      await expect(
        connectionStore.setConnected(MOCK_ROBOT, MOCK_CLIENT)
      ).rejects.toThrowError('IP is not associated with a connection')
    })
  })

  describe('setSubStatus', () => {
    it('should set the pending sub status for the given IP and topic', async () => {
      connectionStore.associateIPWithRobotName(MOCK_IP, MOCK_ROBOT)
      await connectionStore.setPendingConnection(MOCK_ROBOT)
      await connectionStore.setConnected(MOCK_ROBOT, MOCK_CLIENT)
      await connectionStore.setSubStatus(MOCK_IP, MOCK_TOPIC, 'pending')
      expect(connectionStore.isPendingSub(MOCK_ROBOT, MOCK_TOPIC)).toBe(true)
    })

    it('should set the subscribed status for the given IP and topic', async () => {
      connectionStore.associateIPWithRobotName(MOCK_IP, MOCK_ROBOT)
      await connectionStore.setPendingConnection(MOCK_ROBOT)
      await connectionStore.setConnected(MOCK_ROBOT, MOCK_CLIENT)
      await connectionStore.setSubStatus(MOCK_IP, MOCK_TOPIC, 'subscribed')
      expect(connectionStore.isActiveSub(MOCK_ROBOT, MOCK_TOPIC)).toBe(true)
      expect(connectionStore.isPendingSub(MOCK_ROBOT, MOCK_TOPIC)).toBe(false)
    })

    it('should throw an error if the given IP is not associated with a connection', async () => {
      await expect(
        connectionStore.setSubStatus(MOCK_IP, MOCK_TOPIC, 'pending')
      ).rejects.toThrowError('IP is not associated with a connection')
    })
  })

  describe('setUnsubStatus', () => {
    it('should set the pending unsub status for the given IP and topic if it is currently subscribed', async () => {
      connectionStore.associateIPWithRobotName(MOCK_IP, MOCK_ROBOT)
      await connectionStore.setPendingConnection(MOCK_ROBOT)
      await connectionStore.setConnected(MOCK_ROBOT, MOCK_CLIENT)
      await connectionStore.setSubStatus(MOCK_IP, MOCK_TOPIC, 'subscribed')
      await connectionStore.setUnsubStatus(MOCK_IP, MOCK_TOPIC, 'pending')
      expect(connectionStore.isPendingUnsub(MOCK_IP, MOCK_TOPIC)).toBe(true)
      expect(connectionStore.isActiveSub(MOCK_ROBOT, MOCK_TOPIC)).toBe(true)
    })

    it('should set the unsubscribed status for the given IP and topic if it is currently subscribed', async () => {
      connectionStore.associateIPWithRobotName(MOCK_IP, MOCK_ROBOT)
      await connectionStore.setPendingConnection(MOCK_ROBOT)
      await connectionStore.setConnected(MOCK_ROBOT, MOCK_CLIENT)
      await connectionStore.setSubStatus(MOCK_IP, MOCK_TOPIC, 'subscribed')
      await connectionStore.setUnsubStatus(MOCK_IP, MOCK_TOPIC, 'unsubscribed')
      expect(connectionStore.isActiveSub(MOCK_ROBOT, MOCK_TOPIC)).toBe(false)
      expect(connectionStore.isPendingUnsub(MOCK_IP, MOCK_TOPIC)).toBe(false)
    })

    it('should not do anything if the given IP is not associated with a connection', async () => {
      await expect(
        connectionStore.setUnsubStatus(MOCK_IP, MOCK_TOPIC, 'pending')
      ).rejects.toThrowError('IP is not associated with a connection')
    })
  })

  describe('associateIPWithRobotName', () => {
    it('should associate the given IP with the given robot name', () => {
      connectionStore.associateIPWithRobotName(MOCK_IP, MOCK_ROBOT)
      expect(connectionStore.getRobotNameByIP(MOCK_IP)).toBe(MOCK_ROBOT)
    })

    it('should update the association if the IP is already associated with a different robot name', () => {
      connectionStore.associateIPWithRobotName(MOCK_IP, MOCK_ROBOT)
      connectionStore.associateIPWithRobotName(MOCK_IP, 'robot2')
      expect(connectionStore.getRobotNameByIP(MOCK_IP)).toBe('robot2')
    })
  })

  describe('clearStore', () => {
    it('should clear all connections and robot names', async () => {
      await connectionStore.setPendingConnection(MOCK_ROBOT)
      connectionStore.setBrowserWindow(MOCK_WINDOW)
      expect(connectionStore.getAllBrokersInStore()).not.toEqual([])
      expect(connectionStore.getBrowserWindow()).not.toBeNull()
      connectionStore.clearStore()
      expect(connectionStore.getAllBrokersInStore()).toEqual([])
      expect(connectionStore.getBrowserWindow()).toBeNull()
    })
  })

  describe('isConnectedToBroker', () => {
    it('should return false if the given robot name is not associated with a connection', () => {
      expect(connectionStore.isConnectedToBroker(MOCK_ROBOT)).toBe(false)
    })

    it('should return false if the connection client is null', async () => {
      await connectionStore.setPendingConnection(MOCK_ROBOT)
      expect(connectionStore.isConnectedToBroker(MOCK_ROBOT)).toBe(false)
    })

    it('should return true if the connection client is not null', async () => {
      await connectionStore.setPendingConnection(MOCK_ROBOT)
      await connectionStore.setConnected(MOCK_ROBOT, MOCK_CLIENT)
      expect(connectionStore.isConnectedToBroker(MOCK_ROBOT)).toBe(true)
    })
  })

  describe('isConnectingToBroker', () => {
    it('should return false if the given robot name is not associated with a connection', () => {
      expect(connectionStore.isConnectingToBroker(MOCK_ROBOT)).toBe(false)
    })

    it('should return false if the connection client is not null', () => {
      connectionStore.setPendingConnection(MOCK_ROBOT)
      connectionStore.setConnected(MOCK_ROBOT, MOCK_CLIENT)
      expect(connectionStore.isConnectingToBroker(MOCK_ROBOT)).toBe(false)
    })

    it('should return true if the connection client is null and the connection is not terminated', () => {
      connectionStore.setPendingConnection(MOCK_ROBOT)
      expect(connectionStore.isConnectingToBroker(MOCK_ROBOT)).toBe(true)
    })
  })

  describe('isPendingSub', () => {
    it('should return false if the given IP is not associated with a connection', () => {
      expect(connectionStore.isPendingSub(MOCK_ROBOT, MOCK_TOPIC)).toBe(false)
    })

    it('should return false if the topic is not pending', () => {
      connectionStore.associateIPWithRobotName(MOCK_IP, MOCK_ROBOT)
      expect(connectionStore.isPendingSub(MOCK_ROBOT, MOCK_TOPIC)).toBe(false)
    })

    it('should return true if the topic is pending', async () => {
      connectionStore.associateIPWithRobotName(MOCK_IP, MOCK_ROBOT)
      await connectionStore.setPendingConnection(MOCK_ROBOT)
      await connectionStore.setConnected(MOCK_ROBOT, MOCK_CLIENT)
      connectionStore.setSubStatus(MOCK_IP, MOCK_TOPIC, 'pending')
      expect(connectionStore.isPendingSub(MOCK_ROBOT, MOCK_TOPIC)).toBe(true)
    })
  })

  describe('isActiveSub', () => {
    it('should return false if the given IP is not associated with a connection', () => {
      expect(connectionStore.isActiveSub(MOCK_ROBOT, MOCK_TOPIC)).toBe(false)
    })

    it('should return false if the topic is not subscribed', () => {
      connectionStore.associateIPWithRobotName(MOCK_IP, MOCK_ROBOT)
      expect(connectionStore.isActiveSub(MOCK_ROBOT, MOCK_TOPIC)).toBe(false)
    })

    it('should return true if the topic is subscribed', async () => {
      connectionStore.associateIPWithRobotName(MOCK_IP, MOCK_ROBOT)
      await connectionStore.setPendingConnection(MOCK_ROBOT)
      await connectionStore.setConnected(MOCK_ROBOT, MOCK_CLIENT)
      await connectionStore.setSubStatus(MOCK_IP, MOCK_TOPIC, 'subscribed')
      expect(connectionStore.isActiveSub(MOCK_ROBOT, MOCK_TOPIC)).toBe(true)
    })
  })

  describe('isPendingUnsub', () => {
    it('should return false if the given IP is not associated with a connection', () => {
      expect(connectionStore.isPendingUnsub(MOCK_IP, MOCK_TOPIC)).toBe(false)
    })

    it('should return false if the topic is not pending', () => {
      connectionStore.associateIPWithRobotName(MOCK_IP, MOCK_ROBOT)
      expect(connectionStore.isPendingUnsub(MOCK_IP, MOCK_TOPIC)).toBe(false)
    })

    it('should return true if the topic is pending', async () => {
      connectionStore.associateIPWithRobotName(MOCK_IP, MOCK_ROBOT)
      await connectionStore.setPendingConnection(MOCK_ROBOT)
      await connectionStore.setConnected(MOCK_ROBOT, MOCK_CLIENT)
      await connectionStore.setSubStatus(MOCK_IP, MOCK_TOPIC, 'subscribed')
      await connectionStore.setUnsubStatus(MOCK_IP, MOCK_TOPIC, 'pending')
      expect(connectionStore.isPendingUnsub(MOCK_IP, MOCK_TOPIC)).toBe(true)
    })
  })

  describe('isConnectionTerminated', () => {
    it('should return true if the given robot name is not associated with a connection', () => {
      expect(connectionStore.isConnectionTerminated(MOCK_ROBOT)).toBe(true)
    })

    it('should return true if the unreachable status is not null', async () => {
      connectionStore.associateIPWithRobotName(MOCK_IP, MOCK_ROBOT)
      await connectionStore.setPendingConnection(MOCK_ROBOT)
      await connectionStore.setConnected(MOCK_ROBOT, MOCK_CLIENT)
      await connectionStore.setErrorStatus(MOCK_IP, 'Connection refused')
      expect(connectionStore.isConnectionTerminated(MOCK_ROBOT)).toBe(true)
    })

    it('should return false if the unreachable status is null', async () => {
      connectionStore.associateIPWithRobotName(MOCK_IP, MOCK_ROBOT)
      await connectionStore.setPendingConnection(MOCK_ROBOT)
      await connectionStore.setConnected(MOCK_ROBOT, MOCK_CLIENT)
      expect(connectionStore.isConnectionTerminated(MOCK_ROBOT)).toBe(false)
    })
  })

  describe('isKnownPortBlockedIP', () => {
    it('should return false if the given IP is not in the known port blocked IPs set', () => {
      expect(connectionStore.isKnownPortBlockedIP('MOCK_IP_2')).toBe(false)
    })

    it('should return true if the given IP is in the known port blocked IPs set', async () => {
      connectionStore.associateIPWithRobotName(MOCK_IP, MOCK_ROBOT)
      await connectionStore.setPendingConnection(MOCK_ROBOT)
      connectionStore.setErrorStatus(MOCK_IP, 'ECONNREFUSED')
      expect(connectionStore.isKnownPortBlockedIP(MOCK_IP)).toBe(true)
    })
  })
})
