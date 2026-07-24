# from fastapi import Depends, HTTPException, status
# from fastapi.security import OAuth2PasswordBearer




# from datetime import datetime, timedelta
# from jose import JWTError, jwt
# from passlib.context import CryptContext

# SECRET_KEY = "your_secret_key_change_this"
# ALGORITHM = "HS256"
# ACCESS_TOKEN_EXPIRE_MINUTES = 60

# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/admin/login")


# def hash_password(password: str):
#     return pwd_context.hash(password)


# def verify_password(plain_password: str, hashed_password: str):
#     return pwd_context.verify(plain_password, hashed_password)


# def create_access_token(data: dict, expires_delta: timedelta = None):
#     to_encode = data.copy()

#     if expires_delta:
#         expire = datetime.utcnow() + expires_delta
#     else:
#         expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

#     to_encode.update({"exp": expire})

#     encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

#     return encoded_jwt


# def decode_access_token(token: str):
#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#         return payload
#     except JWTError:
#         return None
    


# def get_current_user(token: str = Depends(oauth2_scheme)):
#     payload = decode_access_token(token)

#     if payload is None:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Invalid or expired token"
#         )

#     return payload


# def get_current_admin(current_user: dict = Depends(get_current_user)):
#     if current_user.get("role") != "admin":
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Admin access required"
#         )

#     return current_user




# from datetime import datetime, timedelta

# from fastapi import Depends, HTTPException, status
# from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
# from jose import JWTError, jwt
# from passlib.context import CryptContext


# SECRET_KEY = "your_secret_key_change_this"
# ALGORITHM = "HS256"
# ACCESS_TOKEN_EXPIRE_MINUTES = 60


# pwd_context = CryptContext(
#     schemes=["bcrypt"],
#     deprecated="auto"
# )

# security = HTTPBearer()


# def hash_password(password: str):
#     return pwd_context.hash(password)


# def verify_password(
#     plain_password: str,
#     hashed_password: str
# ):
#     return pwd_context.verify(
#         plain_password,
#         hashed_password
#     )


# def create_access_token(
#     data: dict,
#     expires_delta: timedelta = None
# ):
#     to_encode = data.copy()

#     if expires_delta:
#         expire = datetime.utcnow() + expires_delta
#     else:
#         expire = datetime.utcnow() + timedelta(
#             minutes=ACCESS_TOKEN_EXPIRE_MINUTES
#         )

#     to_encode.update({"exp": expire})

#     return jwt.encode(
#         to_encode,
#         SECRET_KEY,
#         algorithm=ALGORITHM
#     )


# def decode_access_token(token: str):
#     try:
#         return jwt.decode(
#             token,
#             SECRET_KEY,
#             algorithms=[ALGORITHM]
#         )

#     except JWTError:
#         return None


# def get_current_user(
#     credentials: HTTPAuthorizationCredentials = Depends(security)
# ):
#     token = credentials.credentials

#     payload = decode_access_token(token)

#     if payload is None:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Invalid or expired token",
#             headers={"WWW-Authenticate": "Bearer"}
#         )

#     return payload


# def get_current_admin(
#     current_user: dict = Depends(get_current_user)
# ):
#     if current_user.get("role") != "admin":
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Admin access required"
#         )

#     return current_user



from datetime import datetime, timedelta

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext

from dotenv import load_dotenv
import os

load_dotenv()


SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
print("SECRET_KEY =", SECRET_KEY)
print(type(SECRET_KEY))



pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

security = HTTPBearer()


def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str
):
    return pwd_context.verify(
        plain_password,
        hashed_password
    )


def create_access_token(
    data: dict,
    expires_delta: timedelta | None = None
):
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def decode_access_token(token: str):
    try:
        return jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
    except JWTError:
        return None


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )

    return payload


def get_current_admin(
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return current_user