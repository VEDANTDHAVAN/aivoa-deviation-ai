from datetime import date, datetime

from sqlalchemy import Date, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base

class Deviation(Base):
    __tablename__ = "deviations"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    site: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    date_of_occurrence: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    source: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    product_material: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    batch_lot_number: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    initial_impact: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    initial_severity: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    ai_impact: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    ai_impact_reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    ai_severity: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    ai_severity_reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )