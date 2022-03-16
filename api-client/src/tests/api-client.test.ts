import 'jest';
import  { getHealth, Health }   from '../health';
import { HostConfig } from '../types';
import { Response } from '../request';

const host: HostConfig = { hostname: process.env.HOST != null ? process.env.HOST : '' } 

describe('health tests', () => {
  it('returns the correct api version', async () => {
    const healthResponse: Response<Health> = await getHealth(host)
    expect(healthResponse.data.api_version).toBe('2.12') // would need to be dynamic in real life
  })
})