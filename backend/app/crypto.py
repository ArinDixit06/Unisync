import os
import binascii
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.config import settings


def _get_key() -> bytes:
    key_hex = settings.token_encryption_key
    try:
        return binascii.unhexlify(key_hex)
    except binascii.Error as exc:
        raise ValueError("TOKEN_ENCRYPTION_KEY must be hex") from exc


def encrypt(plaintext: str) -> str:
    if plaintext is None:
        return ""
    key = _get_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    data = plaintext.encode("utf-8")
    ciphertext = aesgcm.encrypt(nonce, data, None)
    return binascii.hexlify(nonce + ciphertext).decode("utf-8")


def decrypt(ciphertext_hex: str) -> str:
    if not ciphertext_hex:
        return ""
    key = _get_key()
    raw = binascii.unhexlify(ciphertext_hex)
    nonce, ciphertext = raw[:12], raw[12:]
    aesgcm = AESGCM(key)
    data = aesgcm.decrypt(nonce, ciphertext, None)
    return data.decode("utf-8")
