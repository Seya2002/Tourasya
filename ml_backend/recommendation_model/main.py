# main.py
from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, ValidationError
from typing import List, Optional, Dict, Any
import pandas as pd
import logging
import os
from datetime import datetime
import uvicorn
import traceback

# Import your custom model class
from model import TravelRecommendationModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Travel Package Recommendation API",
    description="ML-powered travel package recommendations based on user preferences",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler for validation errors
@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Validation Error",
            "errors": exc.errors(),
            "body": exc.body if hasattr(exc, 'body') else None
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unexpected error: {str(exc)}")
    logger.error(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )

# Global model instance
recommendation_model = None

class UserPreferences(BaseModel):
    country: str = Field(..., description="Tourist country preference", min_length=1)
    duration: int = Field(7, ge=1, le=30, description="Trip duration in days")
    month: str = Field(..., description="Preferred travel month", min_length=1)
    budget_level: str = Field("medium", description="Budget level: low, medium, high")
    interests: List[str] = Field(default_factory=list, description="List of user interests")
    overnight_stay: Optional[str] = Field(default="", description="Preferred overnight stay type")

    class Config:
        schema_extra = {
            "example": {
                "country": "sri lanka",
                "duration": 7,
                "month": "june",
                "budget_level": "medium",
                "interests": ["cultural", "adventure", "wildlife"],
                "overnight_stay": "hotel"
            }
        }

class RecommendationResponse(BaseModel):
    index: int
    score: float
    country: str
    month: str
    duration: int
    budget: str
    location: str
    interests: str
    activities: str
    overnight_stay: str
    explanation: str
    duration_score: float
    budget_score: float
    interest_score: float
    overnight_score: float

class RecommendationRequest(BaseModel):
    preferences: UserPreferences
    top_k: Optional[int] = Field(10, ge=1, le=50, description="Number of recommendations")
    diverse: Optional[bool] = Field(True, description="Whether to apply diversity to recommendations")

class ModelStatus(BaseModel):
    status: str
    message: str
    dataset_size: Optional[int] = None
    last_updated: Optional[str] = None

@app.on_event("startup")
async def startup_event():
    """Initialize the model on startup"""
    global recommendation_model
    try:
        recommendation_model = TravelRecommendationModel()
        logger.info("Travel Recommendation Model initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing model: {e}")
        recommendation_model = None

@app.get("/", tags=["Health"])
async def root():
    """Root endpoint for health check"""
    return {
        "message": "Travel Package Recommendation API",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health", response_model=ModelStatus, tags=["Health"])
async def health_check():
    """Check the health and status of the recommendation model"""
    global recommendation_model
    
    if recommendation_model is None:
        return ModelStatus(
            status="error",
            message="Model not initialized"
        )
    
    if hasattr(recommendation_model, 'df_processed') and recommendation_model.df_processed is not None:
        return ModelStatus(
            status="ready",
            message="Model is loaded and ready for recommendations",
            dataset_size=len(recommendation_model.df_processed),
            last_updated=datetime.now().isoformat()
        )
    else:
        return ModelStatus(
            status="not_loaded",
            message="Model initialized but no data loaded"
        )

@app.post("/test-request", tags=["Debug"])
async def test_request(request: dict):
    """Test endpoint to see what data is being sent"""
    logger.info(f"Received raw request: {request}")
    return {"received_data": request, "status": "success"}

@app.post("/load-dataset", tags=["Model Management"])
async def load_dataset(file_path: str = "SRI_LANKA_TOUR_DATASET.xlsx"):
    """Load and preprocess the travel dataset"""
    global recommendation_model
    
    if recommendation_model is None:
        raise HTTPException(status_code=500, detail="Model not initialized")
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Dataset file not found: {file_path}")
    
    try:
        # Load data
        success = recommendation_model.load_data(file_path)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to load dataset")
        
        # Preprocess data
        recommendation_model.preprocess_data()
        
        return {
            "message": "Dataset loaded and preprocessed successfully",
            "dataset_size": len(recommendation_model.df),
            "processed_features": len(recommendation_model.feature_columns),
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error loading dataset: {e}")
        raise HTTPException(status_code=500, detail=f"Error loading dataset: {str(e)}")

@app.post("/recommend", response_model=List[RecommendationResponse], tags=["Recommendations"])
async def get_recommendations(request: RecommendationRequest):
    """Get travel package recommendations based on user preferences"""
    global recommendation_model
    
    try:
        if recommendation_model is None:
            raise HTTPException(status_code=500, detail="Model not initialized")
        
        if not hasattr(recommendation_model, 'df_processed') or recommendation_model.df_processed is None:
            raise HTTPException(status_code=400, detail="Dataset not loaded. Please load dataset first using /load-dataset endpoint")
        
        # Log the incoming request for debugging
        logger.info(f"Received recommendation request: {request.dict()}")
        
        # Convert preferences to dictionary
        user_prefs = {
            "country": request.preferences.country.lower().strip(),
            "duration": request.preferences.duration,
            "month": request.preferences.month.lower().strip(), 
            "budget_level": request.preferences.budget_level.lower().strip(),
            "interests": [interest.lower().strip() for interest in request.preferences.interests],
            "overnight_stay": (request.preferences.overnight_stay or "").lower().strip()
        }
        
        logger.info(f"Processed user preferences: {user_prefs}")
        
        # Get recommendations
        if request.diverse:
            recommendations = recommendation_model.get_diverse_recommendations(user_prefs, request.top_k)
        else:
            recommendations = recommendation_model.get_recommendations(user_prefs, request.top_k)
        
        if not recommendations:
            logger.warning("No recommendations found for the given preferences")
            return []
        
        # Format response
        response = []
        for rec in recommendations:
            try:
                explanation = recommendation_model.explain_recommendation(rec)
                response.append(RecommendationResponse(
                    index=rec['index'],
                    score=round(rec['score'], 3),
                    country=rec['country'],
                    month=rec['month'],
                    duration=int(rec['duration']),
                    budget=rec['budget'],
                    location=rec['location'],
                    interests=rec['interests'],
                    activities=rec['activities'],
                    overnight_stay=rec['overnight_stay'],
                    explanation=explanation,
                    duration_score=round(rec['duration_score'], 3),
                    budget_score=round(rec['budget_score'], 3),
                    interest_score=round(rec['interest_score'], 3),
                    overnight_score=round(rec.get('overnight_score', 0.0), 3)
                ))
            except Exception as e:
                logger.error(f"Error processing recommendation {rec.get('index', 'unknown')}: {str(e)}")
                continue
        
        logger.info(f"Generated {len(response)} recommendations for user preferences")
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating recommendations: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")

@app.post("/quick-recommend", tags=["Recommendations"])
async def quick_recommend(
    country: str,
    duration: int = 7,
    month: str = "june",
    budget_level: str = "medium",
    interests: str = "cultural,adventure",
    overnight_stay: str = ""
):
    """Quick recommendation endpoint for simple queries"""
    interest_list = [interest.strip() for interest in interests.split(',')]
    
    preferences = UserPreferences(
        country=country,
        duration=duration,
        month=month,
        budget_level=budget_level,
        interests=interest_list,
        overnight_stay=overnight_stay
    )
    
    request = RecommendationRequest(preferences=preferences, top_k=5)
    return await get_recommendations(request)

@app.get("/countries", tags=["Data Exploration"])
async def get_available_countries():
    """Get list of available tourist countries in the dataset"""
    global recommendation_model
    
    if recommendation_model is None or not hasattr(recommendation_model, 'df_processed'):
        raise HTTPException(status_code=400, detail="Dataset not loaded")
    
    try:
        countries = recommendation_model.df_processed['Tourist_country'].unique().tolist()
        countries = [country for country in countries if country and country.strip()]
        return {"countries": sorted(countries)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching countries: {str(e)}")

@app.get("/interests", tags=["Data Exploration"])
async def get_available_interests():
    """Get list of available interests/activities in the dataset"""
    global recommendation_model
    
    if recommendation_model is None or not hasattr(recommendation_model, 'df_processed'):
        raise HTTPException(status_code=400, detail="Dataset not loaded")
    
    try:
        interests_set = set()
        for interest_str in recommendation_model.df_processed['Interest'].dropna():
            if interest_str and interest_str.strip():
                # Split by common delimiters and clean
                interests = [i.strip().lower() for i in interest_str.split(',')]
                interests_set.update(interests)
        
        interests_list = sorted(list(interests_set))
        return {"interests": interests_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching interests: {str(e)}")

@app.get("/locations", tags=["Data Exploration"])
async def get_available_locations():
    """Get list of available locations in the dataset"""
    global recommendation_model
    
    if recommendation_model is None or not hasattr(recommendation_model, 'df_processed'):
        raise HTTPException(status_code=400, detail="Dataset not loaded")
    
    try:
        locations = recommendation_model.df_processed['Location'].unique().tolist()
        locations = [loc for loc in locations if loc and loc.strip()]
        return {"locations": sorted(locations)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching locations: {str(e)}")

@app.post("/save-model", tags=["Model Management"])
async def save_model(filepath: str = "travel_recommendation_model.pkl"):
    """Save the trained model to disk"""
    global recommendation_model
    
    if recommendation_model is None:
        raise HTTPException(status_code=500, detail="Model not initialized")
    
    if not hasattr(recommendation_model, 'df_processed') or recommendation_model.df_processed is None:
        raise HTTPException(status_code=400, detail="No model to save. Please load and process dataset first.")
    
    try:
        recommendation_model.save_model(filepath)
        return {
            "message": f"Model saved successfully to {filepath}",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving model: {str(e)}")

@app.post("/load-model", tags=["Model Management"])
async def load_model(filepath: str = "travel_recommendation_model.pkl"):
    """Load a pre-trained model from disk"""
    global recommendation_model
    
    if recommendation_model is None:
        recommendation_model = TravelRecommendationModel()
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail=f"Model file not found: {filepath}")
    
    try:
        success = recommendation_model.load_model(filepath)
        if success:
            return {
                "message": f"Model loaded successfully from {filepath}",
                "dataset_size": len(recommendation_model.df_processed) if hasattr(recommendation_model, 'df_processed') else 0,
                "timestamp": datetime.now().isoformat()
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to load model")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading model: {str(e)}")

@app.get("/overnight-stays", tags=["Data Exploration"])
async def get_available_overnight_stays():
    """Get list of available overnight stay types in the dataset"""
    global recommendation_model
    
    if recommendation_model is None or not hasattr(recommendation_model, 'df_processed'):
        raise HTTPException(status_code=400, detail="Dataset not loaded")
    
    try:
        stays = recommendation_model.df_processed['Overnight_stay'].unique().tolist()
        stays = [stay for stay in stays if stay and stay.strip()]
        return {"overnight_stays": sorted(stays)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching overnight stays: {str(e)}")

@app.get("/model-info", tags=["Model Management"])
async def get_model_info():
    """Get information about the current model"""
    global recommendation_model
    
    if recommendation_model is None:
        return {"status": "not_initialized"}
    
    info = {
        "status": "initialized",
        "has_data": hasattr(recommendation_model, 'df_processed') and recommendation_model.df_processed is not None
    }
    
    if info["has_data"]:
        info.update({
            "dataset_size": len(recommendation_model.df_processed),
            "feature_columns": len(recommendation_model.feature_columns),
            "available_countries": len(recommendation_model.df_processed['Tourist_country'].unique()),
            "available_locations": len(recommendation_model.df_processed['Location'].unique())
        })
    
    return info

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
    