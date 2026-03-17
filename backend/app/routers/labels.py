from fastapi import APIRouter, Depends
from app.auth import user_id_dep, user_token_dep
from app.supabase_rest import select, insert, update, delete
from app.schemas import LabelRequest
from app.errors import not_found

router = APIRouter(prefix="/labels", tags=["labels"])


@router.get("")
async def list_labels(user_id: str = Depends(user_id_dep), token: str = Depends(user_token_dep)):
    rows = await select(
        "labels",
        "id,name,color,created_at",
        filters=[("user_id", "eq", user_id)],
        order="name.asc",
        user_token=token,
    )
    return {"labels": rows}


@router.post("")
async def create_label(payload: LabelRequest, user_id: str = Depends(user_id_dep), token: str = Depends(user_token_dep)):
    await insert(
        "labels",
        {"user_id": user_id, "name": payload.name, "color": payload.color},
        user_token=token,
    )
    return {"status": "ok"}


@router.put("/{label_id}")
async def update_label(label_id: str, payload: LabelRequest, user_id: str = Depends(user_id_dep), token: str = Depends(user_token_dep)):
    await update(
        "labels",
        {"name": payload.name, "color": payload.color},
        filters=[("id", "eq", label_id), ("user_id", "eq", user_id)],
        user_token=token,
    )
    return {"status": "ok"}


@router.delete("/{label_id}")
async def delete_label(label_id: str, user_id: str = Depends(user_id_dep), token: str = Depends(user_token_dep)):
    await delete(
        "labels",
        filters=[("id", "eq", label_id), ("user_id", "eq", user_id)],
        user_token=token,
    )
    return {"status": "ok"}


@router.post("/emails/{email_id}/{label_id}")
async def add_label(email_id: str, label_id: str, user_id: str = Depends(user_id_dep), token: str = Depends(user_token_dep)):
    emails = await select(
        "emails",
        "id",
        filters=[("id", "eq", email_id), ("user_id", "eq", user_id)],
        user_token=token,
    )
    if not emails:
        not_found("Email not found")
    await insert(
        "email_labels",
        {"email_id": email_id, "label_id": label_id},
        user_token=token,
    )
    return {"status": "ok"}


@router.delete("/emails/{email_id}/{label_id}")
async def remove_label(email_id: str, label_id: str, user_id: str = Depends(user_id_dep), token: str = Depends(user_token_dep)):
    emails = await select(
        "emails",
        "id",
        filters=[("id", "eq", email_id), ("user_id", "eq", user_id)],
        user_token=token,
    )
    if not emails:
        not_found("Email not found")
    await delete(
        "email_labels",
        filters=[("email_id", "eq", email_id), ("label_id", "eq", label_id)],
        user_token=token,
    )
    return {"status": "ok"}
