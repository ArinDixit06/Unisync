from fastapi import HTTPException, status


def bad_request(message: str, details: dict | None = None):
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail={"code": "bad_request", "message": message, "details": details},
    )


def not_found(message: str):
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "not_found", "message": message},
    )


def forbidden(message: str):
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={"code": "forbidden", "message": message},
    )
