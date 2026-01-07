import re

SAVE_FILENAME_PATTERN = re.compile(r"^[a-zA-Z0-9_-]+$")


class ValidationError(ValueError):
    """Raised when input validation fails."""


def validate_save_filename(filename: str) -> str:
    """Validate that a save filename contains only safe characters.

    Args:
        filename: The save filename to validate (without .sav extension).

    Returns:
        The validated filename.

    Raises:
        ValidationError: If the filename contains invalid characters.
    """
    if not SAVE_FILENAME_PATTERN.match(filename):
        raise ValidationError(
            f"Invalid save filename '{filename}': only alphanumeric characters, underscores, and hyphens are allowed",
        )
    return filename
