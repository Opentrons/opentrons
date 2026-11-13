from fastapi import APIRouter, Request, Response, status
from fastapi.responses import RedirectResponse

router = APIRouter()


@router.get(
    path="/logs/{log_identifier}",
    summary="Get troubleshooting logs",
    description=(
        "Permanently moved to `GET /system/logs/{log_identifier}`."
        "\n\n"
        "If you want the list of steps executed in a protocol,"
        ' like "aspirated 5 µL from well A1...", you probably want the'
        " *protocol analysis commands* (`GET /protocols/{id}/analyses/{id}`)"
        " or *run commands* (`GET /runs/{id}/commands`) instead."
    ),
    status_code=status.HTTP_301_MOVED_PERMANENTLY,
    response_class=RedirectResponse,
)
async def get_logs(
    log_identifier: str, request: Request, response: Response
) -> RedirectResponse:
    """Redirect to the system-server logs endpoint."""
    url = f"/system/logs/{log_identifier}"
    if request.url.query:
        url = f"{url}?{request.url.query}"
    return RedirectResponse(
        url=url,
        status_code=status.HTTP_301_MOVED_PERMANENTLY,
        headers=dict(response.headers),
    )
