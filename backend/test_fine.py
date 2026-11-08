from datetime import date
from app.services import FineService


def test_calculate_fine_on_time():
    """Trả đúng hạn: phạt 0đ"""
    due_date = date(2026, 11, 1)
    end_date = date(2026, 11, 1)
    assert FineService.calculate_fine(due_date, end_date) == 0


def test_calculate_fine_early():
    """Trả sớm hơn hạn: phạt 0đ"""
    due_date = date(2026, 11, 10)
    end_date = date(2026, 11, 5)
    assert FineService.calculate_fine(due_date, end_date) == 0


def test_calculate_fine_late_1_day():
    """Trễ 1 ngày: 5.000đ"""
    due_date = date(2026, 11, 1)
    end_date = date(2026, 11, 2)
    assert FineService.calculate_fine(due_date, end_date) == 5000


def test_calculate_fine_late_3_days():
    """Trễ 3 ngày: 15.000đ"""
    due_date = date(2026, 11, 1)
    end_date = date(2026, 11, 4)
    assert FineService.calculate_fine(due_date, end_date) == 15000


if __name__ == "__main__":
    test_calculate_fine_on_time()
    test_calculate_fine_early()
    test_calculate_fine_late_1_day()
    test_calculate_fine_late_3_days()
    print("Tat ca cac ca kiem thu tinh phat (FineService) da vuot qua thanh cong!")