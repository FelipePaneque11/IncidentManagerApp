from datetime import datetime, timezone
import pytest
from library.incident_sla import calculate_deadline, is_overdue


@pytest.mark.parametrize(
    "priority, expected_deadline",
    [
        ("critical", datetime(2026, 10, 23, 11, 0, tzinfo=timezone.utc)), #1h
        ("high", datetime(2026, 10, 23, 14, 0, tzinfo=timezone.utc)),     #4h
        ("medium", datetime(2026, 10, 24, 10, 0, tzinfo=timezone.utc)),   #24h
        ("low", datetime(2026, 10, 26, 10, 0, tzinfo=timezone.utc)),      #72h
    ]
)

#1 test if deadline was met
def test_deadline_for_each_priority(priority, expected_deadline):
    created_at = datetime(2026, 10, 23, 10, 0, tzinfo=timezone.utc)
    deadline = calculate_deadline(created_at=created_at, priority=priority)

    assert deadline == expected_deadline

#2 test invalid priority inputs
@pytest.mark.parametrize("priority", ["urgent", "HIGH", ""])
def test_invalid_priority_is_rejected(priority):
    created_at = datetime(2026, 10, 23, 10, 0, tzinfo=timezone.utc)

    with pytest.raises(ValueError):
        calculate_deadline(created_at=created_at, priority=priority)

#Test to validade overdue incidents
@pytest.mark.parametrize(
    "status, minute, expected", 
    [
        ("open", 29, False),
        ("open", 30, True),
        ("open", 31, True),
        ("investigating", 31, True),
        ("resolved", 31, False),
    ]
)
def test_incident_overdue_status(status, minute, expected):
    #deadline is at 10h30
    deadline = datetime(2026, 10, 23, 10, 30,tzinfo=timezone.utc)

    now = datetime(2026,10,23,10, minute, tzinfo=timezone.utc)

    result = is_overdue(
        deadline=deadline,
        status=status,
        now=now
    )

    assert result == expected