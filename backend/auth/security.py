#hashes and verify passwords
from pwdlib import PasswordHash

# Create one reusable password hasher using recommended settings.
password_hasher = PasswordHash.recommended()

def hash_password(password:str) -> str:
    return password_hasher.hash(password)

def verify_password(password:str, stored_hash:str) -> bool:
    #compare a login attempt with the stored hash
    return password_hasher.verify(password, stored_hash)