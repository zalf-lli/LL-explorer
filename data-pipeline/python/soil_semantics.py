from __future__ import annotations

import re
import sqlite3
from pathlib import Path

import pandas as pd


SEMANTIC_VERSION = "buek250-soil-semantics-v1"

SOIL_UNIT = "soil_unit"
WATER_AREA = "water_area"
SPECIAL_AREA = "special_area"

WATER_HINTS = (
    "see",
    "teich",
    "hafen",
    "kanal",
    "graben",
    "bach",
    "fluss",
    "gewässer",
    "gewaesser",
    "wasser",
    "moorsee",
    "kuhle",
)

TRANSLATION_RULES = (
    ("versiegelte Flächen", "sealed surfaces"),
    ("Verkippte natürliche Substrate", "relocated natural substrates"),
    ("Versiegelte Flächen", "sealed surfaces"),
    ("marine Sedimente", "marine sediments"),
    ("Mariner Sand", "marine sand"),
    ("Meeresablagerungen", "marine deposits"),
    ("Schmelzwassersand", "glaciofluvial sand"),
    ("Geschiebemergel", "glacial till marl"),
    ("Geschiebelehm", "glacial till loam"),
    ("Geschiebesand", "glacial till sand"),
    ("Flugsand", "aeolian sand"),
    ("Niederungssand", "lowland sand"),
    ("Auenlehm", "floodplain loam"),
    ("Auensand", "floodplain sand"),
    ("Auenmergel", "floodplain marl"),
    ("Hochflutlehm", "high-flood loam"),
    ("Niedermoortorf", "fen peat"),
    ("Hochmoortorf", "raised bog peat"),
    ("Tonschiefer", "clay slate"),
    ("Tongestein", "claystone"),
    ("Sandstein", "sandstone"),
    ("Mergelstein", "marlstone"),
    ("Magmatite und Metamorphite", "igneous and metamorphic rocks"),
    ("Saure Magmatite und Metamorphite", "acidic igneous and metamorphic rocks"),
    ("Saure bis intermediäre Magmatite und Metamorphite", "acidic to intermediate igneous and metamorphic rocks"),
    ("Intermediäre bis basische Magmatite und Metamorphite", "intermediate to mafic igneous and metamorphic rocks"),
    ("Umlagerungsbildungen", "reworked deposits"),
    ("Sonstige Flächen", "other areas"),
    ("Löss", "loess"),
    ("Lessivés", "luvisols"),
    ("Braunerden", "brown soils"),
    ("Gleye", "gley soils"),
    ("Stauwasserböden", "stagnic soils"),
    ("Ah/C-Böden", "Ah/C soils"),
    ("Podsole", "podzols"),
    ("Niedermoore", "fens"),
    ("Auenböden", "alluvial soils"),
    ("Marschen", "marsh soils"),
    ("Pelosole", "pelosols"),
    ("Hochmoore", "raised bogs"),
    ("Schwarzerden", "chernozems"),
    ("Kolluvisole", "colluvials"),
    ("Rohböden", "initial soils"),
    ("Plaggenesche", "plaggen soils"),
    ("Rigosole", "deep-dug soils"),
    ("Tiefumbruchböden", "deep-turned soils"),
    ("Watt", "tidal flats"),
    ("Normbraunerde", "typical brown soil"),
    ("Normpseudogley", "typical pseudogley"),
    ("Normparabraunerde", "typical luvisol"),
    ("Normgley", "typical gley"),
    ("Normpararendzina", "typical pararendzina"),
    ("Normregosol", "typical regosol"),
    ("Normniedermoor", "typical fen"),
    ("Normvega", "typical alluvial soil"),
    ("Normpodsol", "typical podzol"),
    ("Normrendzina", "typical rendzina"),
    ("Normhochmoor", "typical raised bog"),
    ("Normlockersyrosem", "typical loose syrosem"),
    ("Lockersyrosem", "loose syrosem"),
    ("Regosol", "regosol"),
    ("Gley", "gley"),
    ("Braunerde", "brown soil"),
    ("Pseudogley", "pseudogley"),
    ("Parabraunerde", "luvisol"),
    ("Rendzina", "rendzina"),
    ("Niedermoor", "fen"),
    ("Hochmoor", "raised bog"),
    ("Marsch", "marsh"),
    ("Boden", "soil"),
    ("Böden", "soils"),
    ("und", "and"),
    ("mit", "with"),
    ("aus", "from"),
    ("über", "over"),
)


def clean_text(value: object) -> str | None:
    if value is None or pd.isna(value):
        return None
    text = str(value).replace("\\", "/")
    text = re.sub(r"\s+", " ", text).strip(" ,;/")
    return text or None


def slugify(value: object, fallback: str) -> str:
    text = clean_text(value) or fallback
    slug = re.sub(r"[^a-z0-9]+", "-", text.casefold()).strip("-")
    return slug or fallback


def translate_text(value: object) -> str | None:
    text = clean_text(value)
    if not text:
        return None

    translated = text
    for source, target in sorted(TRANSLATION_RULES, key=lambda item: len(item[0]), reverse=True):
        translated = re.sub(re.escape(source), target, translated, flags=re.IGNORECASE)

    translated = re.sub(r"\s+", " ", translated).strip(" ,;/")
    if translated:
        return translated[0].upper() + translated[1:]
    return None


def classify_feature_kind(note: object) -> str:
    text = clean_text(note)
    if not text:
        return SPECIAL_AREA
    lowered = text.casefold()
    if any(keyword in lowered for keyword in WATER_HINTS):
        return WATER_AREA
    return SPECIAL_AREA


def _build_profile_summary(profile_label: str | None, profile_count: object, lead_horizon_count: object) -> tuple[str | None, str | None]:
    label = clean_text(profile_label)
    if not label:
        return None, None

    count = int(profile_count) if profile_count not in (None, "") and not pd.isna(profile_count) else None
    horizons = (
        int(lead_horizon_count)
        if lead_horizon_count not in (None, "") and not pd.isna(lead_horizon_count)
        else None
    )

    parts_de = [label]
    parts_en = [translate_text(label) or label]
    if count:
        parts_de.append(f"{count} Profile")
        parts_en.append(f"{count} profiles")
    if horizons:
        parts_de.append(f"{horizons} Horizonte im Leitprofil")
        parts_en.append(f"{horizons} horizons in lead profile")
    return " | ".join(parts_de), " | ".join(parts_en)


def load_semantic_lookup(config: dict, sqlite_path: Path) -> pd.DataFrame:
    tables = config.get("tables") or {}
    legend_table = tables.get("legend")
    general_table = tables.get("general_legend")
    parent_material_table = tables.get("parent_material")
    profile_table = tables.get("profile")
    horizon_table = tables.get("horizon")

    required = {
        "legend": legend_table,
        "general_legend": general_table,
        "parent_material": parent_material_table,
        "profile": profile_table,
        "horizon": horizon_table,
    }
    missing = [name for name, value in required.items() if not value]
    if missing:
        raise RuntimeError(f"[error] vector.semantics.tables missing required entries: {', '.join(missing)}")

    query = f"""
        WITH profile_summary AS (
            SELECT
                p.GEN_ID,
                COUNT(DISTINCT p.BF_ID) AS profile_count,
                MAX(CASE WHEN p.STATUS = 'Leitprofil' THEN COALESCE(p.BO_SUBTYP_TXT, p.BODSYSTEINH_TXT) END) AS lead_profile_de,
                COUNT(h.HORIZ) FILTER (WHERE p.STATUS = 'Leitprofil') AS lead_horizon_count
            FROM {profile_table} p
            LEFT JOIN {horizon_table} h
                ON p.BF_ID = h.BF_ID
            GROUP BY p.GEN_ID
        )
        SELECT
            l.GEN_ID,
            l.GL_ID,
            l.LE_TXT AS legend_unit_de,
            l.BOD_FT1 AS soil_type_primary_de,
            l.BOD_FT2 AS soil_type_secondary_de,
            l.BOD_FT3 AS soil_type_tertiary_de,
            g.GL_TXT AS general_unit_de,
            b.BAG_FT_CODE AS parent_material_code,
            b.BAG_FT_TXTK AS parent_material_de,
            p.profile_count,
            p.lead_profile_de,
            p.lead_horizon_count
        FROM {legend_table} l
        LEFT JOIN {general_table} g
            ON l.GL_ID = g.GL_ID
        LEFT JOIN {parent_material_table} b
            ON g.BAG_FT_ID = b.BAG_FT_ID
        LEFT JOIN profile_summary p
            ON l.GEN_ID = p.GEN_ID
    """

    with sqlite3.connect(sqlite_path) as con:
        lookup = pd.read_sql_query(query, con)

    if lookup.empty:
        raise RuntimeError(f"[error] semantic lookup query returned 0 rows from {sqlite_path.name}.")

    lookup["GEN_ID"] = lookup["GEN_ID"].astype("Int64")
    for column in (
        "legend_unit_de",
        "soil_type_primary_de",
        "soil_type_secondary_de",
        "soil_type_tertiary_de",
        "general_unit_de",
        "parent_material_de",
        "lead_profile_de",
    ):
        lookup[column] = lookup[column].map(clean_text)

    lookup["legend_unit_en"] = lookup["legend_unit_de"].map(translate_text)
    lookup["soil_type_primary_en"] = lookup["soil_type_primary_de"].map(translate_text)
    lookup["soil_type_secondary_en"] = lookup["soil_type_secondary_de"].map(translate_text)
    lookup["soil_type_tertiary_en"] = lookup["soil_type_tertiary_de"].map(translate_text)
    lookup["general_unit_en"] = lookup["general_unit_de"].map(translate_text)
    lookup["parent_material_en"] = lookup["parent_material_de"].map(translate_text)
    lookup["lead_profile_en"] = lookup["lead_profile_de"].map(translate_text)
    lookup["soil_group_de"] = lookup["soil_type_primary_de"].fillna(lookup["general_unit_de"]).fillna(lookup["lead_profile_de"])
    lookup["soil_group_en"] = lookup["soil_group_de"].map(translate_text)
    lookup["soil_group_key"] = lookup["soil_group_en"].combine_first(lookup["soil_group_de"]).map(
        lambda value: slugify(value, "soil-unit")
    )
    summaries = lookup.apply(
        lambda row: _build_profile_summary(row["lead_profile_de"], row["profile_count"], row["lead_horizon_count"]),
        axis=1,
    )
    lookup["profile_summary_de"] = summaries.map(lambda item: item[0])
    lookup["profile_summary_en"] = summaries.map(lambda item: item[1])
    lookup["feature_kind"] = SOIL_UNIT
    lookup["semantic_version"] = SEMANTIC_VERSION
    lookup["semantic_source"] = "sqlite-buek250-v10"
    return lookup.drop_duplicates(subset=["GEN_ID"], keep="first")


def apply_runtime_contract(frame) -> None:
    feature_kind = []
    special_area_kind = []
    soil_label_de = []
    soil_label_en = []
    soil_group_key = []
    soil_group_de = []
    soil_group_en = []
    source_note_de = []
    source_note_en = []
    semantic_source = []
    semantic_version = []

    for row in frame.itertuples(index=False):
        raw_note = clean_text(getattr(row, "BEMERKUNG", None))
        gen_id = getattr(row, "GEN_ID", None)
        has_gen_id = gen_id is not None and not pd.isna(gen_id)

        if has_gen_id:
            label_de = clean_text(getattr(row, "legend_unit_de", None)) or clean_text(getattr(row, "general_unit_de", None))
            label_en = clean_text(getattr(row, "legend_unit_en", None)) or translate_text(label_de)
            group_de = clean_text(getattr(row, "soil_group_de", None)) or "Bodeneinheit"
            group_en = clean_text(getattr(row, "soil_group_en", None)) or translate_text(group_de) or "Soil unit"
            group_key = clean_text(getattr(row, "soil_group_key", None)) or slugify(group_en, "soil-unit")
            kind = SOIL_UNIT
            special_kind = None
            source = clean_text(getattr(row, "semantic_source", None)) or "sqlite-buek250-v10"
        else:
            kind = classify_feature_kind(raw_note)
            special_kind = kind
            label_de = raw_note or ("Wasserfläche" if kind == WATER_AREA else "Sonderfläche")
            label_en = translate_text(label_de) or ("Water area" if kind == WATER_AREA else "Special area")
            group_de = "Gewässer" if kind == WATER_AREA else "Sonderfläche"
            group_en = "Water area" if kind == WATER_AREA else "Special area"
            group_key = "water-area" if kind == WATER_AREA else "special-area"
            source = "raw-buek250-feature"

        feature_kind.append(kind)
        special_area_kind.append(special_kind)
        soil_label_de.append(label_de)
        soil_label_en.append(label_en)
        soil_group_key.append(group_key)
        soil_group_de.append(group_de)
        soil_group_en.append(group_en)
        source_note_de.append(raw_note)
        source_note_en.append(translate_text(raw_note))
        semantic_source.append(source)
        semantic_version.append(SEMANTIC_VERSION)

    frame["feature_kind"] = feature_kind
    frame["special_area_kind"] = special_area_kind
    frame["soil_label_de"] = soil_label_de
    frame["soil_label_en"] = soil_label_en
    frame["soil_group_key"] = soil_group_key
    frame["soil_group_de"] = soil_group_de
    frame["soil_group_en"] = soil_group_en
    frame["source_note_de"] = source_note_de
    frame["source_note_en"] = source_note_en
    frame["semantic_source"] = semantic_source
    frame["semantic_version"] = semantic_version
