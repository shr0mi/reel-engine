from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
# Import the existing supabase client from your main app file
from database import supabase

router = APIRouter(
    tags=['brand_agent']
)

# --- Pydantic Schemas for Data Validation ---

class BrandPromptUpdate(BaseModel):
    brand_prompt: str

class BrandDetailsUpdate(BaseModel):
    brand_name: str
    what_brand_does: str
    who_are_customers: str
    what_customers_like: str


# --- Endpoints ---

@router.get("/brand-profile")
def get_brand_profile():
    """Retrieves all fields for the single brand profile (ID = 1)."""
    response = (
        supabase.table("brand_profiles")
        .select("*")
        .eq("id", 1)
        .execute()
    )
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Brand profile with ID 1 not found.")
        
    return response.data[0]


@router.post("/brand/prompt")
def update_brand_prompt(payload: BrandPromptUpdate):
    """Updates ONLY the brand_prompt field for ID = 1."""
    response = (
        supabase.table("brand_profiles")
        .update({"brand_prompt": payload.brand_prompt})
        .eq("id", 1)
        .execute()
    )
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Could not update. Profile ID 1 missing.")
        
    return {"message": "Brand prompt updated successfully", "data": response.data[0]}


@router.post("/brand/details")
def update_brand_details(payload: BrandDetailsUpdate):
    """Updates brand_name, what_brand_does, who_are_customers, and what_customers_like for ID = 1."""
    update_data = {
        "brand_name": payload.brand_name,
        "what_brand_does": payload.what_brand_does,
        "who_are_customers": payload.who_are_customers,
        "what_customers_like": payload.what_customers_like
    }
    
    response = (
        supabase.table("brand_profiles")
        .update(update_data)
        .eq("id", 1)
        .execute()
    )
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Could not update. Profile ID 1 missing.")
        
    return {"message": "Brand details updated successfully", "data": response.data[0]}