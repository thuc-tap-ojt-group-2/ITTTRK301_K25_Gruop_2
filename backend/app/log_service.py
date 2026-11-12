from datetime import datetime, timezone
from typing import Optional
from app.models import SystemLog
from sqlalchemy.orm import Session


def create_system_log(
    db: Session,
    action: str,
    resource: str,
    user_id: Optional[int] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> SystemLog:
  log_entry = SystemLog(
      user_id=user_id,
      action=action,
      resource=resource,
      details=details,
      ip_address=ip_address,
      created_at=datetime.now(timezone.utc),
  )
  db.add(log_entry)
  db.commit()
  db.refresh(log_entry)
  return log_entry