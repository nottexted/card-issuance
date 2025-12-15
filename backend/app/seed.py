from __future__ import annotations

import random
import uuid
from datetime import date, datetime, timedelta

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from .db import SessionLocal
from . import models
from .utils import utcnow, next_seq, make_no


MIN_CLIENTS = 15
MIN_BRANCHES = 8
MIN_APPLICATIONS = 60
MIN_BATCHES = 4


def _exists(db: Session, model) -> bool:
    return db.execute(select(text("1")).select_from(model.__table__).limit(1)).first() is not None


def _count(db: Session, model) -> int:
    return int(db.execute(select(text("count(1)")).select_from(model.__table__)).scalar_one())


def _status_id(db: Session, entity: str, code: str) -> int:
    return db.execute(
        select(models.RefStatus.id).where(models.RefStatus.entity_type == entity, models.RefStatus.code == code)
    ).scalar_one()


def _ensure_reference_data(db: Session):
    # Statuses
    if not _exists(db, models.RefStatus):
        statuses = []
        # application
        statuses += [
            models.RefStatus(entity_type="application", code="NEW", name="Новая", sort_order=10),
            models.RefStatus(entity_type="application", code="IN_REVIEW", name="На проверке", sort_order=20),
            models.RefStatus(entity_type="application", code="APPROVED", name="Одобрена", sort_order=30),
            models.RefStatus(entity_type="application", code="REJECTED", name="Отказ", sort_order=40),
            models.RefStatus(entity_type="application", code="IN_BATCH", name="В производстве (партия)", sort_order=50),
        ]
        # batch
        statuses += [
            models.RefStatus(entity_type="batch", code="CREATED", name="Создана", sort_order=10),
            models.RefStatus(entity_type="batch", code="SENT", name="Отправлена", sort_order=20),
            models.RefStatus(entity_type="batch", code="RECEIVED", name="Получена", sort_order=30),
        ]
        # card
        statuses += [
            models.RefStatus(entity_type="card", code="CREATED", name="Карта создана", sort_order=10),
            models.RefStatus(entity_type="card", code="ISSUED", name="Выпущена", sort_order=20),
            models.RefStatus(entity_type="card", code="DELIVERED", name="Доставлена в офис", sort_order=30),
            models.RefStatus(entity_type="card", code="HANDED", name="Выдана клиенту", sort_order=40),
            models.RefStatus(entity_type="card", code="ACTIVATED", name="Активирована", sort_order=50),
            models.RefStatus(entity_type="card", code="CLOSED", name="Закрыта", sort_order=60),
        ]
        db.add_all(statuses)
        db.commit()

    # Channels
    if not _exists(db, models.RefChannel):
        db.add_all(
            [
                models.RefChannel(code="office", name="Офис"),
                models.RefChannel(code="online", name="Интернет-банк"),
                models.RefChannel(code="call", name="Контакт-центр"),
                models.RefChannel(code="partner", name="Партнер"),
            ]
        )
        db.commit()

    # Branches (ensure 6-10)
    if not _exists(db, models.RefBranch):
        db.add_all(
            [
                models.RefBranch(code="MSK-C", name="Центральный офис", city="Москва", address="ул. Тверская, 1", phone="+7 495 000-00-00"),
                models.RefBranch(code="MSK-S", name="Южный офис", city="Москва", address="Варшавское ш., 10", phone="+7 495 111-11-11"),
                models.RefBranch(code="SPB-1", name="Офис Невский", city="Санкт-Петербург", address="Невский пр., 15", phone="+7 812 000-00-00"),
            ]
        )
        db.commit()

    if _count(db, models.RefBranch) < MIN_BRANCHES:
        existing = {b.code for b in db.execute(select(models.RefBranch)).scalars().all()}
        candidates = [
            ("EKB-1", "Екатеринбург • Центр", "Екатеринбург", "пр. Ленина, 25", "+7 343 000-00-00"),
            ("NSK-1", "Новосибирск • Площадь", "Новосибирск", "Красный пр., 10", "+7 383 000-00-00"),
            ("KZN-1", "Казань • Кремль", "Казань", "ул. Баумана, 5", "+7 843 000-00-00"),
            ("KRD-1", "Краснодар • Центр", "Краснодар", "ул. Красная, 40", "+7 861 000-00-00"),
            ("NN-1", "Нижний Новгород • Центр", "Нижний Новгород", "ул. Большая Покровская, 12", "+7 831 000-00-00"),
            ("RST-1", "Ростов-на-Дону • Центр", "Ростов-на-Дону", "ул. Большая Садовая, 20", "+7 863 000-00-00"),
            ("SAM-1", "Самара • Центр", "Самара", "ул. Ленинградская, 9", "+7 846 000-00-00"),
        ]
        add = []
        for code, name, city, address, phone in candidates:
            if code in existing:
                continue
            add.append(models.RefBranch(code=code, name=name, city=city, address=address, phone=phone))
            if _count(db, models.RefBranch) + len(add) >= MIN_BRANCHES:
                break
        if add:
            db.add_all(add)
            db.commit()

    # Delivery methods
    if not _exists(db, models.RefDeliveryMethod):
        db.add_all(
            [
                models.RefDeliveryMethod(code="office", name="Получение в офисе", base_cost=0, sla_days=2),
                models.RefDeliveryMethod(code="courier", name="Курьер по городу", base_cost=350, sla_days=3),
                models.RefDeliveryMethod(code="post", name="Почта России", base_cost=250, sla_days=7),
            ]
        )
        db.commit()

    # Vendors (подрядчики)
    if not _exists(db, models.RefVendor):
        db.add_all(
            [
                models.RefVendor(vendor_type="manufacturer", name="АО 'Пластик-Карт'", contacts="support@plastic-cards.demo", sla_days=3),
                models.RefVendor(vendor_type="manufacturer", name="ООО 'Гознак Сервис'", contacts="support@goznak.demo", sla_days=4),
                models.RefVendor(vendor_type="manufacturer", name="АО 'CardTech'", contacts="support@cardtech.demo", sla_days=5),
                models.RefVendor(vendor_type="courier", name="ООО 'СДЭК'", contacts="support@cdek.demo", sla_days=2),
                models.RefVendor(vendor_type="courier", name="АО 'Почта России'", contacts="support@post.demo", sla_days=7),
            ]
        )
        db.commit()

    # Reject reasons
    if not _exists(db, models.RefRejectReason):
        db.add_all(
            [
                models.RefRejectReason(code="kyc", name="KYC/скоринг — отказ"),
                models.RefRejectReason(code="docs", name="Недостаточно документов"),
                models.RefRejectReason(code="limits", name="Не подтверждены доходы/лимиты"),
                models.RefRejectReason(code="dup", name="Дубликат заявки"),
                models.RefRejectReason(code="client", name="Отказ клиента"),
            ]
        )
        db.commit()

    # Products
    if not _exists(db, models.RefCardProduct):
        db.add_all(
            [
                models.RefCardProduct(code="MIR-CL", name="МИР Classic", payment_system="МИР", level="Classic", currency="RUB", term_months=36),
                models.RefCardProduct(code="MIR-GD", name="МИР Gold", payment_system="МИР", level="Gold", currency="RUB", term_months=36),
                models.RefCardProduct(code="MIR-VIRT", name="МИР Virtual", payment_system="МИР", level="Virtual", currency="RUB", term_months=24, is_virtual=True),
                models.RefCardProduct(code="VISA-PL", name="VISA Platinum", payment_system="VISA", level="Platinum", currency="RUB", term_months=36),
                models.RefCardProduct(code="MC-WE", name="Mastercard World Elite", payment_system="MC", level="World Elite", currency="RUB", term_months=36),
            ]
        )
        db.commit()

    # Tariffs
    if not _exists(db, models.RefTariffPlan):
        db.add_all(
            [
                models.RefTariffPlan(code="BASE", name="Базовый", issue_fee=0, monthly_fee=0, free_condition_text="Без обслуживания при использовании"),
                models.RefTariffPlan(code="PLUS", name="Плюс", issue_fee=0, monthly_fee=199, free_condition_text="Бесплатно при покупках от 10 000 ₽/мес"),
                models.RefTariffPlan(code="PREM", name="Премиум", issue_fee=0, monthly_fee=999, free_condition_text="Бесплатно при остатке от 200 000 ₽"),
            ]
        )
        db.commit()


def _ensure_clients(db: Session):
    cur = _count(db, models.Client)
    if cur >= MIN_CLIENTS:
        return

    random.seed(42)

    first = ["Иван", "Петр", "Егор", "Андрей", "Сергей", "Никита", "Дмитрий", "Алексей", "Максим", "Арсений", "Владимир", "Константин", "Михаил"]
    last = ["Иванов", "Петров", "Сидоров", "Кузнецов", "Смирнов", "Попов", "Васильев", "Зайцев", "Ковалев", "Морозов", "Новиков", "Федоров", "Орлов"]
    middle_m = ["Иванович", "Петрович", "Андреевич", "Сергеевич", "Дмитриевич", "Алексеевич", "Максимович"]
    middle_f = ["Ивановна", "Петровна", "Андреевна", "Сергеевна", "Дмитриевна", "Алексеевна", "Максимовна"]

    segments = ["mass", "affluent", "premium"]
    kyc_statuses = ["new", "verified", "failed"]
    risk = ["low", "medium", "high"]
    cities = ["Москва", "Санкт-Петербург", "Екатеринбург", "Новосибирск", "Казань", "Краснодар", "Нижний Новгород", "Ростов-на-Дону", "Самара"]

    add = []
    need = MIN_CLIENTS - cur
    base_doc = 400000000
    for i in range(need):
        is_f = (i % 3 == 0)
        fn = random.choice(first) + ("а" if is_f and not random.choice(first).endswith("а") else "")
        ln = random.choice(last) + ("а" if is_f else "")
        mn = random.choice(middle_f if is_f else middle_m)
        full = f"{ln} {fn} {mn}"

        phone = f"+7 9{random.randint(10, 99)} {random.randint(100,999)}-{random.randint(10,99)}-{random.randint(10,99)}"
        email = f"user{i+1}@demo.local"

        bd = date(1978 + random.randint(0, 25), random.randint(1, 12), random.randint(1, 28))
        doc_num = f"{random.randint(40, 50)} {random.randint(1, 99):02d} {base_doc + i}"
        city = random.choice(cities)
        reg = f"{city}, ул. Демонстрационная, д. {random.randint(1, 120)}"
        fact = f"{city}, пр. Тестовый, д. {random.randint(1, 120)}"

        add.append(
            models.Client(
                id=uuid.uuid4(),
                client_type="person",
                full_name=full,
                phone=phone,
                email=email,
                birth_date=bd,
                gender="F" if is_f else "M",
                citizenship="RU",
                doc_type="Паспорт",
                doc_number=doc_num,
                doc_issue_date=date(bd.year + 20, random.randint(1, 12), random.randint(1, 28)),
                doc_issuer="ГУ МВД",
                reg_address=reg,
                fact_address=fact,
                segment=random.choice(segments),
                kyc_status=random.choice(kyc_statuses),
                risk_level=random.choice(risk),
                note="seed",
                created_at=utcnow(),
                updated_at=utcnow(),
            )
        )
    db.add_all(add)
    db.commit()


def _ensure_applications(db: Session):
    cur = _count(db, models.CardApplication)
    if cur >= MIN_APPLICATIONS:
        return

    random.seed(43)

    clients = db.execute(select(models.Client)).scalars().all()
    products = db.execute(select(models.RefCardProduct)).scalars().all()
    tariffs = db.execute(select(models.RefTariffPlan)).scalars().all()
    channels = db.execute(select(models.RefChannel)).scalars().all()
    branches = db.execute(select(models.RefBranch)).scalars().all()
    delivery = db.execute(select(models.RefDeliveryMethod)).scalars().all()
    reject_reasons = db.execute(select(models.RefRejectReason)).scalars().all()

    sid_new = _status_id(db, "application", "NEW")
    sid_rev = _status_id(db, "application", "IN_REVIEW")
    sid_app = _status_id(db, "application", "APPROVED")
    sid_rej = _status_id(db, "application", "REJECTED")
    sid_inb = _status_id(db, "application", "IN_BATCH")

    year = utcnow().year
    need = MIN_APPLICATIONS - cur
    add = []
    now = utcnow()

    # distribution
    statuses = (
        ["NEW"] * 14
        + ["IN_REVIEW"] * 10
        + ["APPROVED"] * 18
        + ["REJECTED"] * 10
        + ["IN_BATCH"] * 8
    )
    random.shuffle(statuses)

    for i in range(need):
        st = statuses[i % len(statuses)]
        seq = next_seq(db, "app_seq")
        no = make_no("APP", year, seq, 6)

        c = random.choice(clients)
        p = random.choice(products)
        t = random.choice(tariffs)
        ch = random.choice(channels)
        br = random.choice(branches)
        dm = random.choice(delivery)

        req_at = now - timedelta(days=random.randint(0, 40), hours=random.randint(0, 23))
        planned_issue = (req_at.date() + timedelta(days=random.randint(1, 10))) if st in {"APPROVED", "IN_BATCH"} else None

        status_id = {"NEW": sid_new, "IN_REVIEW": sid_rev, "APPROVED": sid_app, "REJECTED": sid_rej, "IN_BATCH": sid_inb}[st]

        rr_id = None
        decision_at = None
        decision_by = None
        kyc_score = None
        kyc_result = None
        if st in {"APPROVED", "REJECTED", "IN_BATCH"}:
            decision_at = req_at + timedelta(hours=random.randint(3, 72))
            decision_by = random.choice(["Оператор", "Супервайзер", "Скоринг-сервис"])
            kyc_score = random.randint(300, 900)
            kyc_result = "pass" if st != "REJECTED" else random.choice(["fail", "manual"])
            if st == "REJECTED":
                rr_id = random.choice(reject_reasons).id

        add.append(
            models.CardApplication(
                id=uuid.uuid4(),
                application_no=no,
                client_id=c.id,
                product_id=p.id,
                tariff_id=t.id,
                channel_id=ch.id,
                branch_id=br.id,
                delivery_method_id=dm.id,
                delivery_address=c.fact_address if dm.code != "office" else None,
                embossing_name=(c.full_name.split()[0] + " " + c.full_name.split()[1])[:22],
                requested_at=req_at,
                planned_issue_date=planned_issue,
                status_id=status_id,
                reject_reason_id=rr_id,
                kyc_score=kyc_score,
                kyc_result=kyc_result,
                kyc_notes="seed",
                decision_at=decision_at,
                decision_by=decision_by,
                priority=random.choice(["low", "normal", "high"]),
                limits_requested_json={"atm_day": random.choice([100000, 150000, 200000]), "pos_day": random.choice([200000, 300000, 500000])},
                consent_personal_data=True,
                consent_marketing=random.choice([False, False, True]),
                comment="seed",
                updated_at=req_at,
            )
        )

    db.add_all(add)
    db.commit()


def _ensure_batches_and_cards(db: Session):
    random.seed(44)

    # Ensure batches
    vendors = db.execute(select(models.RefVendor).where(models.RefVendor.vendor_type == "manufacturer")).scalars().all()
    if not vendors:
        return

    sid_b_created = _status_id(db, "batch", "CREATED")
    sid_b_sent = _status_id(db, "batch", "SENT")
    sid_b_recv = _status_id(db, "batch", "RECEIVED")

    sid_c_created = _status_id(db, "card", "CREATED")
    sid_c_issued = _status_id(db, "card", "ISSUED")
    sid_c_del = _status_id(db, "card", "DELIVERED")
    sid_c_hand = _status_id(db, "card", "HANDED")
    sid_c_act = _status_id(db, "card", "ACTIVATED")

    now = utcnow()

    # Create missing batches
    cur_batches = _count(db, models.IssueBatch)
    to_make = max(0, MIN_BATCHES - cur_batches)
    year = now.year
    new_batches = []
    for _ in range(to_make):
        seq = next_seq(db, "batch_seq")
        batch_no = make_no("BAT", year, seq, 6)
        vendor = random.choice(vendors)
        st = random.choice(["CREATED", "SENT", "RECEIVED"])
        st_id = {"CREATED": sid_b_created, "SENT": sid_b_sent, "RECEIVED": sid_b_recv}[st]
        planned = now + timedelta(days=random.randint(1, 7))
        sent_at = planned + timedelta(hours=2) if st in {"SENT", "RECEIVED"} else None
        recv_at = sent_at + timedelta(days=random.randint(1, 5)) if st == "RECEIVED" else None
        new_batches.append(
            models.IssueBatch(
                id=uuid.uuid4(),
                batch_no=batch_no,
                vendor_id=vendor.id,
                status_id=st_id,
                planned_send_at=planned,
                sent_at=sent_at,
                received_at=recv_at,
                created_at=now - timedelta(days=random.randint(1, 20)),
            )
        )
    if new_batches:
        db.add_all(new_batches)
        db.commit()

    batches = db.execute(select(models.IssueBatch)).scalars().all()

    # Put some APPROVED apps into batches (set status IN_BATCH)
    sid_inb = _status_id(db, "application", "IN_BATCH")
    sid_app = _status_id(db, "application", "APPROVED")

    approved_apps = db.execute(
        select(models.CardApplication).where(models.CardApplication.status_id.in_([sid_app, sid_inb]))
    ).scalars().all()

    # ensure at least 20 applications in batches
    in_batch_app_ids = set(
        db.execute(select(models.IssueBatchItem.application_id)).scalars().all()
    )
    target_in_batch = min(25, len(approved_apps))
    candidates = [a for a in approved_apps if a.id not in in_batch_app_ids]
    random.shuffle(candidates)

    items_to_add = []
    for a in candidates[: max(0, target_in_batch - len(in_batch_app_ids))]:
        b = random.choice(batches)
        items_to_add.append(
            models.IssueBatchItem(
                id=uuid.uuid4(),
                batch_id=b.id,
                application_id=a.id,
                produced_at=(b.sent_at or now) + timedelta(days=random.randint(0, 2)),
                delivered_to_branch_at=(b.received_at or now) + timedelta(days=random.randint(1, 4)) if (b.received_at or b.sent_at) else None,
            )
        )
        a.status_id = sid_inb
        a.updated_at = now
    if items_to_add:
        db.add_all(items_to_add)
        db.commit()

    # Ensure cards for some applications, with different stages
    existing_cards = {c.application_id for c in db.execute(select(models.Card)).scalars().all()}
    apps_for_cards = db.execute(select(models.CardApplication)).scalars().all()
    random.shuffle(apps_for_cards)

    make_count = min(30, len(apps_for_cards))
    to_create = [a for a in apps_for_cards[:make_count] if a.id not in existing_cards and db.get(models.RefStatus, a.status_id).code in {"APPROVED", "IN_BATCH"}]

    for a in to_create:
        seq = next_seq(db, "card_seq")
        card_no = make_no("CARD", now.year, seq, 6)
        stage = random.choice(["CREATED", "ISSUED", "DELIVERED", "HANDED", "ACTIVATED"])
        sid = {"CREATED": sid_c_created, "ISSUED": sid_c_issued, "DELIVERED": sid_c_del, "HANDED": sid_c_hand, "ACTIVATED": sid_c_act}[stage]

        issued_at = None
        delivered_at = None
        handed_at = None
        activated_at = None

        if stage in {"ISSUED", "DELIVERED", "HANDED", "ACTIVATED"}:
            issued_at = now - timedelta(days=random.randint(1, 15))
        if stage in {"DELIVERED", "HANDED", "ACTIVATED"}:
            delivered_at = issued_at + timedelta(days=random.randint(1, 4)) if issued_at else None
        if stage in {"HANDED", "ACTIVATED"}:
            handed_at = (delivered_at or issued_at or now) + timedelta(days=random.randint(1, 3))
        if stage in {"ACTIVATED"}:
            activated_at = handed_at + timedelta(hours=random.randint(1, 48)) if handed_at else None

        c = models.Card(
            id=uuid.uuid4(),
            card_no=card_no,
            application_id=a.id,
            status_id=sid,
            pan_masked=f"4276 **** **** {random.randint(1000, 9999)}",
            expiry_month=random.randint(1, 12),
            expiry_year=now.year + 3,
            issued_at=issued_at if stage != "CREATED" else None,
            delivered_at=delivered_at,
            handed_at=handed_at,
            activated_at=activated_at,
        )
        db.add(c)
    db.commit()


def seed():
    db = SessionLocal()
    try:
        _ensure_reference_data(db)
        _ensure_clients(db)
        _ensure_applications(db)
        _ensure_batches_and_cards(db)
    finally:
        db.close()

if __name__ == '__main__':
    seed()
