from datetime import date
from typing import Optional
from sqlalchemy.orm import Session
from app.models import AuditLog

FINE_RATE_PER_DAY = 5000  

class FineService:
    @staticmethod
    def calculate_fine(due_date: Optional[date], end_date: Optional[date]) -> int:
        """
        FINE-01 & BR06:
        Tính tiền phạt = max(0, số ngày trễ) * 5.000đ.
        Đúng hạn hoặc trả trước hạn phạt 0đ.
        """
        if not due_date or not end_date:
            return 0
        overdue_days = (end_date - due_date).days
        return max(0, overdue_days) * FINE_RATE_PER_DAY


class LogService:
    @staticmethod
    def record(db: Session, action: str, detail: str, actor_id: Optional[int] = None) -> AuditLog:
        """
        LOG-01: Ghi vết nhật ký thao tác quan trọng vào bảng audit_logs
        """
        log_entry = AuditLog(
            actor_id=actor_id,
            action=action,
            detail=detail
        )
        db.add(log_entry)
        return log_entry