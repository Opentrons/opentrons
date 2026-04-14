"""tls.manager contains code for managing the robot's TLS stack."""

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Final, Literal, Self, Type

from .ca_manager import TLSCAManager
from .ee_manager import TLSEEManager
from .robot_details.interface import RobotDetails

LOG = logging.getLogger(__name__)


class TLSManager:
    """A class for managing the combination of CAs and end-entities that allows TLS communication."""

    EXPIRY_CHECKER_POLL_PERIOD: Final = timedelta(hours=7)

    def __init__(
        self,
        ca_manager: TLSCAManager,
        ee_manager: TLSEEManager,
        robot_details: RobotDetails,
    ) -> None:
        """Build the TLSManager."""
        self._ca_manager = ca_manager
        self._ee_manager = ee_manager
        self._expiry_task: "asyncio.Task[None] | None" = None
        self._robot_details_task: "asyncio.Task[None] | None" = None
        self._robot_details = robot_details
        self._robot_details_lock = asyncio.Lock()

    @classmethod
    async def create(
        cls: Type[Self],
        ca_cert_dir: Path,
        ca_key_dir: Path,
        tls_ee_dir: Path,
        terminator_reload: Literal["systemd-nginx", "dev-none"],
    ) -> Self:
        """Create a TLS manager, taking several useful setup steps."""
        if terminator_reload == "systemd-nginx":
            # dynamic import to make it so this can still be run on dev machines where python-dbus is not present
            from .robot_details.machine import RobotDetailsMachine

            robot_details: RobotDetails = RobotDetailsMachine()
        else:
            from .robot_details.dev import RobotDetailsDev

            robot_details = RobotDetailsDev()

        robot_hostname, robot_ips = await robot_details.get_details()
        ca_manager = TLSCAManager(key_dir=ca_key_dir, ca_cert_dir=ca_cert_dir)
        ee_manager = TLSEEManager(
            key_dir=tls_ee_dir,
            ee_cert_dir=tls_ee_dir,
            robot_hostname=robot_hostname or "unknown",
            # note: we are an early-init system. NetworkManager may not be up by this time, and while
            # we could use a subprocess to ifconfig -a, we may not have DHCP resolution by this time.
            # the easiest way is to start with no IP addresses and then to let the system that configures
            # IP addresses tell us when they start to exist.
            robot_ips=robot_ips,
            rotate_fn=(
                TLSEEManager.rotate_cert_nginx
                if terminator_reload == "systemd-nginx"
                else TLSEEManager.rotate_cert_none
            ),
        )

        obj = cls(
            ca_manager=ca_manager, ee_manager=ee_manager, robot_details=robot_details
        )
        await obj.refresh_ee()
        await obj.schedule_expiry_task(cls.EXPIRY_CHECKER_POLL_PERIOD)
        return obj

    async def teardown(self) -> None:
        """Tear down the TLS manager at the end of a session."""
        await self.cancel_expiry_task()
        await self.cancel_robot_details_task()
        self._ee_manager.remove_cert("shutting down")

    async def refresh_ee(self) -> None:
        """Refresh the end-entity cert that we're presenting."""
        precert = self._ee_manager.generate_precert()
        signed = self._ca_manager.sign_precert(precert)
        await self._ee_manager.install_cert(signed)

    def expiry_task_running(self) -> bool:
        """True if the expiry task is running properly. Mostly used internally and for testing."""
        return self._expiry_task is not None and not self._expiry_task.done()

    async def cancel_expiry_task(self) -> None:
        """Cancel a running expiry task. Mostly used for testing; callers should prefer teardown()."""
        if not self._expiry_task:
            return
        if not self._expiry_task.done():
            self._expiry_task.cancel()
            try:
                await self._expiry_task
            except asyncio.CancelledError:
                pass
            finally:
                self._expiry_task = None
        else:
            self._expiry_task = None

    async def cancel_robot_details_task(self) -> None:
        """Cancel a running robot details task. Mostly used for testing; callers should prefer teardown()."""
        if not self._robot_details_task:
            return
        if not self._robot_details_task.done():
            self._robot_details_task.cancel()
            try:
                await self._robot_details_task
            except asyncio.CancelledError:
                pass
            finally:
                self._robot_details_task = None
        else:
            self._robot_details_task = None

    async def schedule_expiry_task(self, poll_time: timedelta) -> None:
        """Create and run the expiry monitoring task. Mostly used for testing; callers should prefer create()."""
        await self.cancel_expiry_task()
        self._expiry_task = asyncio.create_task(self._expiry_task_outer(poll_time))

    async def schedule_robot_details_task(self) -> None:
        """Create and run the robot details monitoring task. Mostly used for testing; callers should prefer create()."""
        await self.cancel_robot_details_task()
        self._robot_details_task = asyncio.create_task(self._robot_details_task_outer())

    async def _expiry_task_outer(self, poll_time: timedelta) -> None:
        try:
            await self._expiry_task_inner(poll_time)
        except asyncio.CancelledError:
            LOG.info("Stopping expiry task")
        except BaseException:
            LOG.exception("Expiry task failed")
            raise

    async def _expiry_task_inner(self, poll_time: timedelta) -> None:
        while True:
            now = datetime.now(tz=timezone.utc)
            if self._ca_manager.must_build_next(now + poll_time):
                self._ca_manager.build_next(now)
            # Rotating CAs means rotating EEs
            if self._ca_manager.must_rotate(now + poll_time):
                self._ca_manager.rotate(now)
                await self.refresh_ee()
            if not self._ee_manager.ready(now + poll_time):
                await self.refresh_ee()
            await asyncio.sleep(poll_time.total_seconds())

    async def _robot_details_task_inner(self) -> None:
        async for (
            new_hostname,
            new_ips,
        ) in self._robot_details.yield_details_on_change():
            LOG.info(f"Robot details changed to hostname={new_hostname} ips={new_ips}")
            async with self._robot_details_lock:
                if not self._ee_manager.set_robot_details(
                    datetime.now(timezone.utc), new_hostname, new_ips
                ):
                    await self.refresh_ee()

    async def _robot_details_task_outer(self) -> None:
        try:
            await self._robot_details_task_inner()
        except asyncio.CancelledError:
            LOG.info("Stopping robot details task")
        except BaseException:
            LOG.exception("Robot details task failed")
            raise
