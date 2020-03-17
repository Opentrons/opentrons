import typing
from fastapi import APIRouter, Query, Depends
from opentrons.hardware_control import HardwareAPILike
from opentrons.hardware_control.types import Axis

from robot_server.service.dependencies import get_hardware
from robot_server.service.models import pipettes


router = APIRouter()


@router.get("/pipettes",
            description="Get the pipettes currently attached",
            summary="This endpoint lists properties of the pipettes currently "
                    "attached to the robot like name, model, and mount. It "
                    "queries a cached value unless the refresh query parameter"
                    " is set to true, in which case it will actively scan for "
                    "pipettes. This requires disabling the pipette motors "
                    "(which is done automatically) and therefore should only "
                    "be done through user intent",
            response_model=pipettes.PipettesByMount)
async def get_pipettes(
        refresh: typing.Optional[bool] = Query(
            False,
            description="If true, actively scan for attached pipettes. Note:"
                        " this requires  disabling the pipette motors and"
                        " should only be done when no  protocol is running "
                        "and you know  it won't cause a problem"),
        hardware: HardwareAPILike = Depends(get_hardware))\
        -> pipettes.PipettesByMount:
    """
    Query robot for model strings on 'left' and 'right' mounts, and return a
    dict with the results keyed by mount. By default, this endpoint provides
    cached values, which will not interrupt a running session. WARNING: if the
    caller supplies the "refresh=true" query parameter, this method will
    interrupt a sequence of Smoothie operations that are in progress, such as a
    protocol run.

    If a pipette is "uncommissioned" (e.g.: does not have a model string
    written to on-board memory), or if no pipette is present, the corresponding
    mount will report `'model': null`
    """
    if refresh is True:
        await hardware.cache_instruments()     # type: ignore

    attached = hardware.attached_instruments   # type: ignore

    def make_pipette(mount, o):
        return pipettes.AttachedPipette(
            model=o.get('model'),
            name=o.get('name'),
            id=o.get('pipette_id'),
            mount_axis=str(Axis.by_mount(mount)).lower(),
            plunger_axis=str(Axis.of_plunger(mount)).lower(),
            tip_length=o.get('tip_length', 0) if o.get('model') else None
        )

    e = {mount.name.lower(): make_pipette(mount, data)
         for mount, data in attached.items()}

    return pipettes.PipettesByMount(**e)
