"""Basic command handlers."""

from typing import TYPE_CHECKING
import subprocess
import sys

if TYPE_CHECKING:
    from pytauri import Commands

from ..models.base import Greeting, AppInfo, GreetRequest
from ..models.hdf_models import RasCommanderStatus


def register_basic_commands(commands: "Commands"):
    """Register basic application commands."""

    @commands.command()
    async def greet(body: GreetRequest) -> Greeting:
        """Basic greeting command."""
        return Greeting(f"Hello, {body.name}!")

    @commands.command()
    async def get_app_info() -> AppInfo:
        """Get application information."""
        return AppInfo(
            name="eFlow",
            version="0.1.0",
            description="HDF5 Analysis with RAS Commander"
        )

    @commands.command()
    async def check_ras_commander_status() -> RasCommanderStatus:
        """Check if ras-commander is available and get status."""
        print("🔍 PyTauri: Checking ras-commander status...")

        try:
            # Try to import ras-commander
            import ras_commander
            version = getattr(ras_commander, '__version__', 'unknown')

            print(f"✅ PyTauri: ras-commander v{version} found")
            return RasCommanderStatus(
                available=True,
                version=version,
                message=f"ras-commander v{version} disponible via PyTauri"
            )

        except ImportError as e:
            print(f"❌ PyTauri: ras-commander not found: {e}")
            return RasCommanderStatus(
                available=False,
                version=None,
                message=f"ras-commander no encontrado: {e}"
            )
        except Exception as e:
            print(f"❌ PyTauri: Error checking ras-commander: {e}")
            return RasCommanderStatus(
                available=False,
                version=None,
                message=f"Error verificando ras-commander: {e}"
            )
