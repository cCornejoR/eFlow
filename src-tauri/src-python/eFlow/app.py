"""Main application module with PyTauri integration."""

from anyio.from_thread import start_blocking_portal
from pytauri import builder_factory, context_factory

from .ext_mod import ext_mod as commands


def main() -> int:
    """Run the eFlow application."""
    try:
        with start_blocking_portal("asyncio") as portal:
            app = builder_factory().build(
                context=context_factory(),
                invoke_handler=commands.generate_handler(portal),
            )
            exit_code = app.run_return()
            return exit_code
    except Exception as e:
        print(f"Error: {e}")
        print("This Python module is designed to be run through the Tauri binary.")
        print("Please use 'npm run tauri dev' or 'npm run tauri build' to run the application.")
        return 1


# Export ext_mod for PyTauri entry point
ext_mod = commands
