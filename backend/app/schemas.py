from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class ErrorResponse(BaseModel):
    code: str
    message: str
    details: dict | None = None


class LinkedAccount(BaseModel):
    id: str
    provider: str
    email_address: str
    display_name: Optional[str] = None
    created_at: datetime


class EmailSummary(BaseModel):
    id: str
    thread_id: Optional[str]
    subject: Optional[str]
    sender_name: Optional[str]
    sender_email: str
    preview_snippet: Optional[str]
    received_at: datetime
    is_read: bool
    is_starred: bool
    is_archived: bool
    is_snoozed: bool
    snoozed_until: Optional[datetime]
    has_attachments: bool
    processing_status: str
    risk_level: Optional[str]
    priority_level: Optional[str]
    category: str


class EmailDetail(EmailSummary):
    body_html: Optional[str] = None
    summary_bullets: Optional[list[str]] = None
    risk_reasons: Optional[list[str]] = None
    priority_reason: Optional[str] = None


class EmailUpdate(BaseModel):
    is_read: Optional[bool] = None
    is_starred: Optional[bool] = None
    is_archived: Optional[bool] = None


class SnoozeRequest(BaseModel):
    snoozed_until: datetime


class Attachment(BaseModel):
    filename: str
    content_type: str
    content_base64: str


class SendEmailRequest(BaseModel):
    account_id: str
    to: List[str]
    cc: Optional[List[str]] = None
    bcc: Optional[List[str]] = None
    subject: str
    body_html: str
    attachments: Optional[List[Attachment]] = None


class LabelRequest(BaseModel):
    name: str
    color: Optional[str] = Field(default="#64748b")


class SearchResult(BaseModel):
    emails: List[EmailSummary]


class SuggestedEvent(BaseModel):
    id: str
    title: str
    start_datetime: Optional[datetime]
    end_datetime: Optional[datetime]
    location: Optional[str]
    description: Optional[str]
    confirmed_at: Optional[datetime]
    dismissed_at: Optional[datetime]


class WebhookAck(BaseModel):
    status: str = "ok"
