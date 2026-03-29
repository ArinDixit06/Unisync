import json
from typing import Any

from app.crypto import decrypt, encrypt

MAIL_ARMOR_HEADER = "-----BEGIN UNISYNC SECURE MAIL-----"
MAIL_ARMOR_FOOTER = "-----END UNISYNC SECURE MAIL-----"
MAX_SECURE_TEXT_CHARS = 100_000


def _armor(ciphertext: str) -> str:
    return "\n".join(
        [
            MAIL_ARMOR_HEADER,
            "Version: UniSync-Mail-1",
            "Cipher: AES-256-GCM",
            "",
            ciphertext,
            MAIL_ARMOR_FOOTER,
        ]
    )


def _unarmor(value: str) -> str:
    lines = [line.rstrip() for line in value.strip().splitlines()]
    if len(lines) < 5 or lines[0] != MAIL_ARMOR_HEADER or lines[-1] != MAIL_ARMOR_FOOTER:
        raise ValueError("Value is not a UniSync armored payload")
    return "".join(line for line in lines[1:-1] if line and ":" not in line)


def is_mail_armored(value: Any) -> bool:
    return isinstance(value, str) and value.strip().startswith(MAIL_ARMOR_HEADER)


def encrypt_mail_text(value: str | None) -> str | None:
    if value is None:
        return None
    bounded = value[:MAX_SECURE_TEXT_CHARS]
    return _armor(encrypt(bounded))


def decrypt_mail_text(value: str | None) -> str | None:
    if value is None:
        return None
    if not is_mail_armored(value):
        return value
    return decrypt(_unarmor(value))


def encrypt_mail_json(value: Any) -> str | None:
    if value is None:
        return None
    return encrypt_mail_text(json.dumps(value, separators=(",", ":"), sort_keys=True))


def decrypt_mail_json(value: Any, default: Any):
    if value is None:
        return default
    if isinstance(value, (dict, list)):
        return value
    decoded = decrypt_mail_text(value)
    if decoded in (None, ""):
        return default
    try:
        return json.loads(decoded)
    except json.JSONDecodeError:
        return default
