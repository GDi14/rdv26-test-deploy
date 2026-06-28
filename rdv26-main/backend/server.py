from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import requests
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone

# Logging configuration
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', '')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')

# Environment configuration
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'development')

# Disable Swagger/ReDoc docs and OpenAPI schema in production for security
app_configs = {}
if ENVIRONMENT == 'production':
    app_configs.update({
        "docs_url": None,
        "redoc_url": None,
        "openapi_url": None
    })

app = FastAPI(**app_configs)
api_router = APIRouter(prefix="/api")


def get_supabase_headers(use_service_role: bool = False):
    if use_service_role and not SUPABASE_SERVICE_ROLE_KEY:
        logger.error("SUPABASE_SERVICE_ROLE_KEY is required for delete operations but is not set.")
        raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY is required for delete operations.")

    key = SUPABASE_SERVICE_ROLE_KEY if use_service_role else SUPABASE_KEY
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }


def supabase_insert(table_name: str, data: dict, use_service_role: bool = False):
    try:
        url = f"{SUPABASE_URL}/rest/v1/{table_name}"
        headers = get_supabase_headers(use_service_role=use_service_role)
        response = requests.post(url, json=data, headers=headers)
        if response.status_code >= 400:
            logger.error(f"Supabase Insert Error ({response.status_code}): {response.text}")
            raise HTTPException(status_code=response.status_code, detail=f"Supabase insert error: {response.text}")
        response.raise_for_status()
        return response.json()[0]
    except requests.exceptions.RequestException as e:
        logger.error(f"Supabase Connection Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to connect to Supabase: {str(e)}")


def supabase_insert_batch(table_name: str, data: list, use_service_role: bool = False):
    try:
        url = f"{SUPABASE_URL}/rest/v1/{table_name}"
        headers = get_supabase_headers(use_service_role=use_service_role)
        response = requests.post(url, json=data, headers=headers)
        if response.status_code >= 400:
            logger.error(f"Supabase Batch Insert Error ({response.status_code}): {response.text}")
            raise HTTPException(status_code=response.status_code, detail=f"Supabase batch insert error: {response.text}")
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Supabase Connection Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to connect to Supabase: {str(e)}")


def supabase_select(table_name: str, query_params: dict = None):
    try:
        url = f"{SUPABASE_URL}/rest/v1/{table_name}"
        headers = get_supabase_headers()
        response = requests.get(url, params=query_params, headers=headers)
        if response.status_code >= 400:
            logger.error(f"Supabase Select Error ({response.status_code}): {response.text}")
            raise HTTPException(status_code=response.status_code, detail=f"Supabase select error: {response.text}")
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Supabase Connection Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to connect to Supabase: {str(e)}")


def supabase_count(table_name: str, query_params: dict = None):
    try:
        url = f"{SUPABASE_URL}/rest/v1/{table_name}"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Prefer": "count=exact"
        }
        params = query_params or {}
        params["limit"] = 1
        response = requests.get(url, params=params, headers=headers)
        if response.status_code >= 400:
            logger.error(f"Supabase Count Error ({response.status_code}): {response.text}")
            raise HTTPException(status_code=response.status_code, detail=f"Supabase count error: {response.text}")
        response.raise_for_status()
        content_range = response.headers.get("Content-Range", "")
        if "/" in content_range:
            return int(content_range.split("/")[-1])
        return 0
    except requests.exceptions.RequestException as e:
        logger.error(f"Supabase Connection Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to connect to Supabase: {str(e)}")


def supabase_delete(table_name: str, query_params: dict, use_service_role: bool = False):
    try:
        url = f"{SUPABASE_URL}/rest/v1/{table_name}"
        headers = get_supabase_headers(use_service_role=use_service_role)
        response = requests.delete(url, params=query_params, headers=headers)
        if response.status_code >= 400:
            logger.error(f"Supabase Delete Error ({response.status_code}): {response.text}")
            raise HTTPException(status_code=response.status_code, detail=f"Supabase delete error: {response.text}")

        response.raise_for_status()

        deleted_rows = []
        try:
            deleted_rows = response.json()
        except ValueError:
            deleted_rows = []

        if isinstance(deleted_rows, list) and len(deleted_rows) == 0:
            logger.error(f"Supabase Delete Warning: no rows deleted for {table_name} with params {query_params}")
            raise HTTPException(status_code=404, detail="Registration not found or already deleted")

        return {"status": "success", "deleted": len(deleted_rows)}
    except requests.exceptions.RequestException as e:
        logger.error(f"Supabase Connection Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to connect to Supabase: {str(e)}")


# ============ Models ============
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


class RegistrationCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    school: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=6, max_length=20)
    grade: str = Field(min_length=1, max_length=20)
    event_id: str
    team_name: Optional[str] = None
    team_size: Optional[int] = Field(default=1, ge=1, le=20)
    notes: Optional[str] = Field(default=None, max_length=500)


class Registration(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    full_name: str
    school: str
    email: str
    phone: str
    grade: str
    event_id: str
    team_name: Optional[str] = None
    team_size: int = 1
    notes: Optional[str] = None
    confirmation_code: str = Field(default_factory=lambda: f"RDV-{uuid.uuid4().hex[:8].upper()}")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ContactCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    subject: str = Field(min_length=2, max_length=120)
    message: str = Field(min_length=5, max_length=2000)


class ContactMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    subject: str
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============ Static event catalogue ============
EVENTS = [
    {
        "id": "Melodia",
        "code": "01",
        "name": "MELODIA",
        "tagline": "BAND COMPETETION",
        "description": "Melodia is more than music it’s the expression of soul, the dance of diversity, and the anthem of unity. Enter a realm where every beat is a heartbeat, and every note a shared truth.",
        "category": "MUSIC",
        "team_size": 4,
        "duration": "24 HRS",
        "prize": "$2,500",
        "color": "#fc2c08",
    },
    {
        "id": "invogue",
        "code": "02",
        "name": "INVOGUE",
        "tagline": "FASHION × DESIGN",
        "description": "Fashion has always shaped our lives— a bold, ever-evolving journey. Now, it's time for our visionaries to captivate with elegance, boldness, and artistry. Welcome to Invogue, where creativity knows no limits.",
        "category": "DESIGN",
        "team_size": 6,
        "duration": "2 HRS",
        "prize": "$1,800",
        "color": "#66C7F4",
    },
    {
        "id": "seismic",
        "code": "03",
        "name": "SEISMIC",
        "tagline": "DANCE COMPETETION",
        "description": "Immerse yourself in a world beyond reality, where the subconscious reigns supreme. Seismic presents an evening of mesmerizing movement, where dancers weave a tale of surrealism and wonder. Let the dreamscape unfold, and get ready to experience the thrill of SEISMIC.",
        "category": "DANCE",
        "team_size": 5,
        "duration": "4 HRS",
        "prize": "$2,000",
        "color": "#D4E5FB",
    },
    {
        "id": "gourmet crusade",
        "code": "04",
        "name": "GOURMET CRUSADE",
        "tagline": "Cook off",
        "description": "Embark on, fighting as epic warriors of flavour. Be prepared to unleash your creative madness in this festival of food. Thread lightly, for some of these dishes of Gourmet Crusade are to die for.",
        "category": "COOKING",
        "team_size": 3,
        "duration": "90 MIN",
        "prize": "$1,200",
        "color": "#5900ff",
    },
    {
        "id": "game f",
        "code": "05",
        "name": "GAME F",
        "tagline": "gaming competetion",
        "description": "Beneath the roaring skies and electric lights, the arena awakens. Legends will rise, teams will clash this is Game F.Grab your controller, your legacy begins now!",
        "category": "GAMING",
        "team_size": 2,
        "duration": "2 HRS",
        "prize": "$1,500",
        "color": "#D9D2C4",
    },
    {
        "id": "non_participant",
        "code": "06",
        "name": "NON-PARTICIPANT",
        "tagline": "FESTIVAL ATTENDEE",
        "description": "For students attending the festival to spectate, cheer, and enjoy the vibe without participating in any specific event.",
        "category": "GENERAL",
        "team_size": 1,
        "duration": "ALL DAY",
        "prize": "N/A",
        "color": "#FFFFFF",
    },
]


# ============ Routes ============
@api_router.get("/")
async def root():
    return {"message": "RDV API ONLINE", "year": 2026}


@api_router.post("/status", response_model=StatusCheck)
def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(**input.model_dump())
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    supabase_insert("status_checks", doc, use_service_role=True)
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
def get_status_checks():
    status_checks = supabase_select("status_checks", {"order": "timestamp.desc"})
    for check in status_checks:
        if isinstance(check.get('timestamp'), str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'].replace('Z', '+00:00'))
    return status_checks


@api_router.get("/events")
async def list_events():
    return {"events": EVENTS}


@api_router.get("/events/{event_id}")
async def get_event(event_id: str):
    for e in EVENTS:
        if e["id"] == event_id:
            return e
    raise HTTPException(status_code=404, detail="Event not found")


@api_router.post("/registrations", response_model=Registration)
def create_registration(payload: RegistrationCreate):
    if not any(e["id"] == payload.event_id for e in EVENTS):
        raise HTTPException(status_code=400, detail="Invalid event_id")

    reg = Registration(**payload.model_dump())
    doc = reg.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    supabase_insert("registrations", doc)
    return reg


@api_router.post("/registrations/batch", response_model=List[Registration])
def create_registration_batch(payload: List[RegistrationCreate]):
    if not payload:
        return []

    school_name = payload[0].school
    for p in payload:
        if p.school != school_name:
            raise HTTPException(status_code=400, detail="All registrations in batch must belong to the same school")
        if not any(e["id"] == p.event_id for e in EVENTS):
            raise HTTPException(status_code=400, detail=f"Invalid event_id: {p.event_id}")

    try:
        supabase_delete("registrations", {"school": f"eq.{school_name}"}, use_service_role=True)
    except HTTPException as he:
        if he.status_code != 404:
            raise he

    docs = []
    regs = []
    for p in payload:
        reg = Registration(**p.model_dump())
        doc = reg.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        docs.append(doc)
        regs.append(reg)
    
    if docs:
        supabase_insert_batch("registrations", docs)
    return regs


@api_router.get("/registrations", response_model=List[Registration])
def list_registrations(school: Optional[str] = None):
    params = {"order": "created_at.desc"}
    if school:
        params["school"] = f"eq.{school}"
    rows = supabase_select("registrations", params)
    for r in rows:
        if isinstance(r.get('created_at'), str):
            r['created_at'] = datetime.fromisoformat(r['created_at'].replace('Z', '+00:00'))
    return rows


@api_router.delete("/registrations/{registration_id}")
def delete_registration(registration_id: str):
    return supabase_delete("registrations", {"id": f"eq.{registration_id}"}, use_service_role=True)

@api_router.get("/stats")
def stats():
    total = supabase_count("registrations")
    by_event = {}
    for e in EVENTS:
        by_event[e["id"]] = supabase_count("registrations", {"event_id": f"eq.{e['id']}"})
    return {"total": total, "by_event": by_event}


@api_router.post("/contact", response_model=ContactMessage)
def submit_contact(payload: ContactCreate):
    msg = ContactMessage(**payload.model_dump())
    doc = msg.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    supabase_insert("contact_messages", doc)
    return msg


@api_router.get("/health")
def health_check():
    import time
    db_status = "UP"
    latency_ms = 0
    try:
        start_time = time.time()
        # Querying status_checks table to verify Supabase connection
        supabase_select("status_checks", {"limit": 1})
        latency_ms = int((time.time() - start_time) * 1000)
    except Exception as e:
        logger.error(f"Health Check Database Error: {e}")
        db_status = f"DOWN: {str(e)}"

    config_status = "OK"
    missing_vars = []
    if not SUPABASE_URL:
        missing_vars.append("SUPABASE_URL")
    if not SUPABASE_KEY:
        missing_vars.append("SUPABASE_KEY")
    if missing_vars:
        config_status = f"WARNING: Missing env variables: {', '.join(missing_vars)}"

    overall_status = "UP" if db_status == "UP" and not missing_vars else "DEGRADED"
    if db_status.startswith("DOWN"):
        overall_status = "DOWN"

    return {
        "status": overall_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": {
            "status": db_status,
            "latency_ms": latency_ms
        },
        "configuration": config_status
    }


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

