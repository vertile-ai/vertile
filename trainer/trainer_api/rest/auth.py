from ninja.security import HttpBearer
from django.contrib.auth.models import User
from django.conf import settings
import jwt
from datetime import datetime, timedelta


class AuthBearer(HttpBearer):
    def authenticate(self, request, token):
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("user_id")
            if user_id:
                user = User.objects.get(id=user_id)
                return user
        except (jwt.PyJWTError, User.DoesNotExist):
            pass
        return None


auth_backend = AuthBearer()


# Helper function to generate tokens
def create_token(user):
    payload = {
        "user_id": user.id,
        "exp": datetime.utcnow() + timedelta(days=1),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
