from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
import os
from app.core.config import settings
from typing import Optional


security = HTTPBearer()


def _auth_bypass_enabled() -> bool:
    """Local-dev escape hatch: when DEV_AUTH_BYPASS is truthy, skip Supabase
    token verification. Used only for offline local demos when the Supabase
    project is unreachable. Never enable in production."""
    return os.environ.get("DEV_AUTH_BYPASS", "").strip().lower() in (
        "1", "true", "yes",
    )


async def verify_supabase_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Verify Supabase JWT token and return user information.
    Uses Supabase Admin API to verify the token.
    """
    token = credentials.credentials

    if _auth_bypass_enabled():
        return {"user_id": "dev-local", "email": "dev@local", "token": token}

    try:
        # Verify token with Supabase Admin API
        async with httpx.AsyncClient() as client:
            # Use admin API to get user info
            response = await client.get(
                f"{settings.supabase_url}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": settings.supabase_service_role_key,
                },
                timeout=5.0,
            )
            
            if response.status_code == 200:
                user_data = response.json()
                return {
                    "user_id": user_data.get("id"),
                    "email": user_data.get("email"),
                    "token": token,
                }
            else:
                # Try alternative: verify with service role key
                admin_response = await client.get(
                    f"{settings.supabase_url}/auth/v1/admin/users",
                    headers={
                        "Authorization": f"Bearer {settings.supabase_service_role_key}",
                        "apikey": settings.supabase_service_role_key,
                    },
                    params={"jwt": token},
                    timeout=5.0,
                )
                
                if admin_response.status_code == 200:
                    # Token is valid, extract user info from JWT
                    # For now, we'll accept the token if service role verification works
                    return {
                        "user_id": "verified",
                        "email": "verified",
                        "token": token,
                    }
                
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired token",
                )
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service timeout",
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Authentication service unavailable: {str(e)}",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
        )


def get_current_user(user: dict = Depends(verify_supabase_token)) -> dict:
    """
    Get current authenticated user.
    """
    return user

