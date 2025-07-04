"""Extension module for PyTauri integration."""

from anyio.from_thread import start_blocking_portal
from pytauri import Commands, builder_factory, context_factory

# Import command registration functions
from .commands.basic_commands import register_basic_commands
from .commands.hdf_commands import register_hdf_commands
from .commands.hdf_explorer_commands import register_hdf_explorer_commands

# Create commands instance and register all commands
print("🚀 Initializing eFlow PyTauri commands...")
ext_mod = Commands()

print("📝 Registering basic commands...")
register_basic_commands(ext_mod)

print("📊 Registering HDF commands...")
register_hdf_commands(ext_mod)

print("🔍 Registering HDF Explorer commands...")
register_hdf_explorer_commands(ext_mod)

print("✅ All commands registered successfully!")


def main() -> int:
    """Main entry point for the eFlow application."""
    try:
        with start_blocking_portal("asyncio") as portal:
            app = builder_factory().build(
                context=context_factory(),
                invoke_handler=ext_mod.generate_handler(portal),
            )
            exit_code = app.run_return()
            return exit_code
    except Exception as e:
        print(f"Error: {e}")
        print("This Python module is designed to be run through the Tauri binary.")
        print("Please use 'npm run tauri dev' or 'npm run tauri build' to run the application.")
        return 1


__all__ = ["main", "ext_mod"]
