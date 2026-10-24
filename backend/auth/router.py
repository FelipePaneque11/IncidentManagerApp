#handles authentication-related API requests
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth.schemas import UserCreate, UserRead
from auth.security import hash_password
from database.connection import get_db
from database.models import User

# Group these endpoints under /auth in the API and Swagger.
router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", status_code=201, response_model=UserRead)
def register_user(account: UserCreate,  db: Session = Depends(get_db)):
    user = User(
        id=str(uuid4()),
        username=account.username,
        hashed_password= hash_password(account.password)
    )

    #adding new user to db
    db.add(user)

    try:
        db.commit()
    except IntegrityError:
        #The database rejects duplicate usernames
        db.rollback()
        raise HTTPException(
            status_code=409, 
            detail="Account conflicts with an existing account"
            ) from None

    db.refresh(user)

    return user

    
