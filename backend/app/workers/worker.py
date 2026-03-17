from arq import cron
from app.workers.tasks import process_email


class WorkerSettings:
    functions = [process_email]
    cron_jobs = []
