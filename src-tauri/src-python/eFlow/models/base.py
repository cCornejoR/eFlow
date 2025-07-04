"""Basic models for the application."""

from pydantic import BaseModel, RootModel


class Greeting(RootModel[str]):
    """Greeting message model as a root model for string."""
    pass


class AppInfo(BaseModel):
    """Application information model."""
    name: str
    version: str
    description: str


class GreetRequest(BaseModel):
    """Request model for greeting."""
    name: str = "World"
