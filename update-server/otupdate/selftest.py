import aiohttp
import logging
from time import sleep

log = logging.getLogger(__name__)


def _open(path):
    ret = open(path, 'rb')
    return ret


async def health_check(
        session: aiohttp.ClientSession,
        port: int,
        retries: int = 0,
        backoff_interval: float = 2.0):
    log.debug('Making health request (retries remaining: {})'.format(retries))
    detail = ''
    test_status = 'in progress'
    try:
        async with session.get(
                'http://127.0.0.1:{}/server/update/health'.format(
                    port)) as r1:
            health_status = r1.status
            log.debug('Health status: {}'.format(health_status))
            if health_status != 200:
                test_status = 'failure'
                detail = 'Health check returned status {}'.format(
                    health_status)
    except Exception as e:
        health_status = 500
        detail = 'Exception during health check: {}'.format(
            type(e).__name__)
    if int(health_status/100.0) == 2:
        # just return the test status and detail
        pass
    elif retries > 0:
        log.debug("Health status: {} - retrying in {} seconds".format(
            health_status, backoff_interval))
        sleep(backoff_interval)
        test_status, detail = await health_check(
            session=session,
            port=port,
            retries=retries-1,
            backoff_interval=backoff_interval*2)
    else:
        test_status = 'failure'
    return test_status, detail


async def run_self_test(port, filename) -> dict:
    """
    Make the following requests to the server running on the specified port:
    - GET  /server/update/health
    - POST /server/update/bootstrap {"whl": @wheelpath}

    Test is successful if both requests return 200 and no exceptions are raised
    :return: a dict with keys 'status' and 'details', where status is either
        'success' or 'failure' and 'details contains a description
    """
    log.info('Running self test against server on port {}'.format(port))

    async with aiohttp.ClientSession() as session:
        test_status, detail = await health_check(session, port, retries=0)

        if test_status != 'failure':
            log.debug('Making update request')
            try:
                async with session.post(
                        'http://127.0.0.1:{}/server/update/bootstrap'.format(
                            port),
                        data={'whl': _open(filename)}) as r2:
                    update_status = r2.status
                    log.debug('Update status: {}'.format(update_status))
                    if update_status != 200:
                        test_status = 'failure'
                        detail = 'Update check returned status {}'.format(
                            update_status)
            except Exception as e:
                log.exception('Exception during self test:')
                test_status = 'failure'
                detail = 'Exception during update check: {}'.format(
                    type(e).__name__)

    if test_status == 'failure':
        res = {'status': 'failure', 'message': detail}
    else:
        res = {'status': 'success'}
    log.debug('Selftest result: {}'.format(res))
    return res
