import logging
from datetime import datetime
from fastapi import APIRouter
from robot_server.system import time
from robot_server.service.system import models as time_models

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


def _get_valid_time_links(api_router: APIRouter) \
        -> time_models.SystemTimeLinks:
    """ Get valid links for time resource"""
    return time_models.SystemTimeLinks(systemTime=api_router.url_path_for(
            get_time.__name__))


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
    sys_time = await time.set_system_time(new_time.data.attributes.systemTime)
    return _create_response(sys_time)
