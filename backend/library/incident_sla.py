#This library is to calculate the deadline of an incident's creation time and priority
#It works independently of FastAPI and the database
#SLA means service level agreement.

# For a critical level incident - deadline is 1 hour
# For a high level incident - deadline is 4 hours
# For a medium level incident - deadline is 24 hours
# For a low level incident - deadline is 72 hours

from datetime import datetime, timedelta

#dictionary priority-deadline
#hashmap
SLA_HOURS = {
    "critical":1,
    "high":4,
    "medium":24,
    "low":72
}

#This method expects created at and its priority as input and describe its return type(datetime)
def calculate_deadline(created_at:datetime, priority:str) -> datetime:
    if priority not in SLA_HOURS:
        raise ValueError("Unsupported incident priority")

    hours = SLA_HOURS[priority]

    return created_at + timedelta(hours=hours)

#method to check if an incident is overdue
def is_overdue( deadline: datetime, status:str,  now:datetime,) -> bool:
    if status == "resolved":
        return False
    return now >= deadline