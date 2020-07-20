import logging
from datetime import datetime
from fastapi import APIRouter
from opentrons.system import time
from typing import Dict
from robot_server.service.system import models as time_models
from robot_server.service.system import errors
from robot_server.service.json_api import ResourceLink

router = APIRouter()
log = logging.getLogger(__name__)

"""
These routes allows the client to read & update robot system time
"""


def _create_response(dt: datetime) \
        -> time_models.SystemTimeResponse:
    """Create a SystemTimeResponse with system datetime"""
    return time_models.SystemTimeResponse(
        data=time_models.SystemTimeResponseDataModel.create(
            attributes=time_models.SystemTimeAttributes(
                systemTime=dt
            ),
            resource_id="time"
        ),
        links=_get_valid_time_links(router)
    )


def _get_valid_time_links(api_router: APIRouter) -> Dict[str, ResourceLink]:
    """ Get valid links for time resource"""
    return {
        "GET": ResourceLink(href=api_router.url_path_for(
            get_time.__name__)),
        "PUT": ResourceLink(href=api_router.url_path_for(
            set_time.__name__))
    }


@router.get("/system/time",
            description="Fetch system time & date",
            summary="Get robot's time status, which includes- current UTC "
                    "date & time, local timezone, whether robot time is synced"
                    " with an NTP server &/or it has an active RTC.",
            response_model=time_models.SystemTimeResponse
            )
async def get_time() -> time_models.SystemTimeResponse:
    res = await time.get_system_time()
    return _create_response(res)


@router.put("/system/time",
            description="Update system time",
            summary="Set robot time",
            response_model=time_models.SystemTimeResponse)
async def set_time(new_time: time_models.SystemTimeRequest) \
        -> time_models.SystemTimeResponse:
    sys_time, err = await time.set_system_time(
        new_time.data.attributes.systemTime)
    if err:
        if 'already synchronized with NTP or RTC' in err:
            raise errors.SystemTimeAlreadySynchronized(err)
        else:
            raise errors.SystemSetTimeException(err)
    return _create_response(sys_time)
