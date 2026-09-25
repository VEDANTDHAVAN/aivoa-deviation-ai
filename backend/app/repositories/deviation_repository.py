from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.deviation import Deviation
from app.api.schemas import DeviationCreate, DeviationUpdate

def create_deviation(
    db: Session, data: DeviationCreate,
) -> Deviation:
    deviation = Deviation(**data.model_dump())

    db.add(deviation)
    db.commit()
    db.refresh(deviation)

    return deviation

def get_deviation(
    db: Session, deviation_id: int,
) -> Deviation | None:
    statement = select(Deviation).where(
        Deviation.id == deviation_id
    )

    return db.scalar(statement)

def get_deviations(
    db: Session, limit: int = 50,
    offset: int = 0, search: str | None = None,
    severity: str | None = None, site: str | None = None,
) -> list[Deviation]:
    statement = select(Deviation)
    if search:
        term = f"%{search}%"
        statement = statement.where((Deviation.title.ilike(term)) | (Deviation.batch_lot_number.ilike(term)) | (Deviation.site.ilike(term)))
    if severity:
        statement = statement.where(Deviation.initial_severity == severity)
    if site:
        statement = statement.where(Deviation.site == site)
    statement = (
        statement.order_by(
            Deviation.created_at.desc()
        ).offset(offset).limit(limit)
    )

    return list(db.scalars(statement).all())

def update_deviation(db: Session, deviation: Deviation, data: DeviationUpdate) -> Deviation:
    for field, value in data.model_dump().items():
        setattr(deviation, field, value)
    db.commit()
    db.refresh(deviation)
    return deviation
