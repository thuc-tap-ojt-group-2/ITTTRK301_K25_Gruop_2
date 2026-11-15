from datetime import datetime, timezone
from typing import Optional
from app.models import AuditLog
from sqlalchemy.orm import Session


def create_system_log(
    db: Session,
    action: str,
    resource: str,
    user_id: Optional[int] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    log_detail = f"{resource}: {details}" if details else resource
    if ip_address:
        log_detail = f"{log_detail} (IP: {ip_address})"

    log_entry = AuditLog(
        actor_id=user_id,
        action=action,
        detail=log_detail[:255],
        created_at=datetime.now(timezone.utc),
    )
    db.add(log_entry)
    return log_entry