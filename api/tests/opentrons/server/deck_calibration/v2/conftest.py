import pytest


@pytest.mark.api2_only
@pytest.fixture
async def deck_cal_session(async_client):
    await async_client.post('/calibration/v2/')
