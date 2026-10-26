#supply the logged-in user to any endpoint that requires authentication.
from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import User

#reads the session, finds the user, and rejects requests without a valid login.
def get_current_user(request:Request, db:Session = Depends(get_db)) -> User:
    #Session middleware reads and verifies the browser's session cookie
    user_id = request.session.get("user_id")

    if not user_id:
        raise HTTPException(status_code=401, detail="Please log in")

    #load the current account information from postgreSQL
    user = db.get(User, user_id)

    if user is None:
        request.session.clear()
        raise HTTPException(status_code=401, detail="Please log in")

    return user

#request gives us access to the incoming request, including its session.
#db supplies the database session.
# The function returns a User or stops the request with 401.