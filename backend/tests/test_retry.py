import pytest
from unittest.mock import MagicMock

from backend.agents.retry import retry_sync


def test_retry_sync_succeeds_on_first_try() -> None:
    fn = MagicMock(return_value="ok")
    result = retry_sync(fn, attempts=3, delay=0)
    assert result == "ok"
    assert fn.call_count == 1


def test_retry_sync_retries_and_succeeds_on_second_try() -> None:
    fn = MagicMock(side_effect=[RuntimeError("fail"), "ok"])
    result = retry_sync(fn, attempts=3, delay=0)
    assert result == "ok"
    assert fn.call_count == 2


def test_retry_sync_raises_after_all_attempts_exhausted() -> None:
    fn = MagicMock(side_effect=RuntimeError("always fails"))
    with pytest.raises(RuntimeError, match="always fails"):
        retry_sync(fn, attempts=3, delay=0)
    assert fn.call_count == 3


def test_retry_sync_raises_last_exception() -> None:
    fn = MagicMock(side_effect=[RuntimeError("first"), ValueError("second"), KeyError("third")])
    with pytest.raises(KeyError):
        retry_sync(fn, attempts=3, delay=0)


def test_retry_sync_single_attempt_raises_immediately() -> None:
    fn = MagicMock(side_effect=RuntimeError("fail"))
    with pytest.raises(RuntimeError):
        retry_sync(fn, attempts=1, delay=0)
    assert fn.call_count == 1
