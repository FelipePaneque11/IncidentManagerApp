#handles authentication-related API requests
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy import select

from auth.schemas import UserCreate, UserRead
from auth.security import hash_password, verify_password
from auth.dependencies import get_current_user
from auth.schemas import UserCreate,UserLogin, UserRead

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

@router.post("/login", response_model=UserRead)
def login(
    credentials: UserLogin,
    request:Request,
    db:Session = Depends(get_db)
):
    #find the account matching the submitted username
    user = db.scalar(select(User).where(User.username == credentials.username))

    #use the same message for an unkown username of incorrect password
    #prevent attacks
    if user is None or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401,detail="Incorrect username or password")

    #start a fresh login session containing only the user's ID
    request.session.clear()
    request.session["user_id"]= user.id

    return user

@router.get("/me", response_model=UserRead)
def read_current_user(user: User = Depends(get_current_user)):
    #the dependency rejects this request unless the user is loggede in
    return user

@router.post("/logout",status_code=204)
def logout(request:Request):
    #remove the login data from the browser session
    request.session.clear()

    return Response(status_code=204)

#user-list endpoint
@router.get("/users", response_model=list[UserRead], dependencies=[Depends(get_current_user)])
def list_users(db: Session = Depends(get_db)):
    #return safe account fields for the assignment dropdown
    return db.scalars(select(User).order_by(User.username)).all()