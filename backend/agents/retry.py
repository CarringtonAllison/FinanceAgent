import time
from collections.abc import Callable
from typing import TypeVar

T = TypeVar("T")


def retry_sync(fn: Callable[[], T], attempts: int = 3, delay: float = 1.0) -> T:
    """Retry a synchronous callable up to `attempts` times with `delay` seconds between tries."""
    last_exc: Exception = RuntimeError("No attempts made")
    for attempt in range(attempts):
        try:
            return fn()
        except Exception as exc:
            last_exc = exc
            if attempt < attempts - 1:
                time.sleep(delay)
    raise last_exc
