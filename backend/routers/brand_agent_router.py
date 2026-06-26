from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from brand_agent import analyze_brand_prompt
from db import get_db

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
    with get_db() as (conn, cur):
        cur.execute("SELECT * FROM brand_profiles WHERE id = 1")
        row = cur.fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="Brand profile with ID 1 not found.")

    return dict(row)


@router.post("/brand/prompt")
async def update_brand_prompt(payload: BrandPromptUpdate):
    """
    Updates ONLY the brand_prompt field for ID = 1.
    goes through brand_agent and returns response
    """

    if not payload.brand_prompt.strip():
        raise HTTPException(status_code=400, detail="Brand prompt cannot be empty.")

    try:
        # Call the async agent function
        analysis_result = await analyze_brand_prompt(payload.brand_prompt)

        with get_db() as (conn, cur):
            cur.execute(
                "UPDATE brand_profiles SET brand_prompt = ? WHERE id = 1",
                (payload.brand_prompt,),
            )

            if cur.rowcount == 0:
                raise HTTPException(
                    status_code=404,
                    detail="Could not update. Profile ID 1 missing.",
                )

        return analysis_result
    except HTTPException:
        raise
    except Exception as e:
        # Catch unexpected errors from the LLM or API lines
        raise HTTPException(status_code=500, detail=f"An error occurred during analysis: {str(e)}")


@router.post("/brand/details")
def update_brand_details(payload: BrandDetailsUpdate):
    """Updates brand_name, what_brand_does, who_are_customers, and what_customers_like for ID = 1."""
    with get_db() as (conn, cur):
        cur.execute(
            """
            UPDATE brand_profiles
            SET brand_name = ?,
                what_brand_does = ?,
                who_are_customers = ?,
                what_customers_like = ?
            WHERE id = 1
            """,
            (
                payload.brand_name,
                payload.what_brand_does,
                payload.who_are_customers,
                payload.what_customers_like,
            ),
        )

        if cur.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Could not update. Profile ID 1 missing.",
            )

        cur.execute("SELECT * FROM brand_profiles WHERE id = 1")
        row = cur.fetchone()

    return {"message": "Brand details updated successfully", "data": dict(row)}
