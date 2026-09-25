from datetime import datetime, timezone, timedelta

# Indian Standard Time (IST) = UTC + 5:30
IST = timezone(timedelta(hours=5, minutes=30))

def get_ist_now() -> datetime:
    """
    Returns current timezone-aware datetime in Indian Standard Time (IST).
    """
    return datetime.now(IST)

def get_ist_now_naive() -> datetime:
    """
    Returns current naive datetime representing Indian Standard Time (IST).
    Guarantees SQLite stores exact Indian clock time without UTC lag.
    """
    return datetime.now(IST).replace(tzinfo=None)

def get_ist_iso() -> str:
    """
    Returns ISO-8601 formatted string with explicit +05:30 IST offset.
    Example: '2026-09-24T22:45:00.123456+05:30'
    """
    return datetime.now(IST).isoformat()
