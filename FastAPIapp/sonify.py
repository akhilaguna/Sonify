from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2AuthorizationCodeBearer
from pydantic import BaseModel
from typing import Optional
import httpx
import os
from dotenv import load_dotenv
from openai import AsyncOpenAI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

load_dotenv()  # Load environment variables from .env file

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure OAuth2
oauth2_scheme = OAuth2AuthorizationCodeBearer(
    authorizationUrl="https://accounts.spotify.com/authorize",
    tokenUrl="https://accounts.spotify.com/api/token",
)

# Environment variables
SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
SPOTIFY_REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI")
OPENWEATHERMAP_API_KEY = os.getenv("OPENWEATHERMAP_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Initialize OpenAI client
openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)

# Pydantic models
class Location(BaseModel):
    latitude: float
    longitude: float

class PlaylistResponse(BaseModel):
    playlist_id: str
    playlist_name: str

# Helper functions
async def get_spotify_token(code: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://accounts.spotify.com/api/token",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": SPOTIFY_REDIRECT_URI,
                "client_id": SPOTIFY_CLIENT_ID,
                "client_secret": SPOTIFY_CLIENT_SECRET,
            },
        )
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get Spotify token")
        return response.json()["access_token"]

async def get_weather_data(location: Location):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"http://api.openweathermap.org/data/2.5/weather",
            params={
                "lat": location.latitude,
                "lon": location.longitude,
                "appid": OPENWEATHERMAP_API_KEY,
                "units": "metric",
            },
        )
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get weather data")
        data = response.json()
        return {
            "temperature": data["main"]["temp"],
            "description": data["weather"][0]["description"],
        }

async def get_mood_from_weather(weather_data):
    try:
        response = await openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a mood expert that can decide which mood is invoked by given weather conditions."},
                {"role": "user", "content": f"What mood would be invoked by this weather: Temperature: {weather_data['temperature']}°C, Description: {weather_data['description']}? Respond with a single word."},
            ]
        )
        return response.choices[0].message.content.strip().lower()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to get mood from OpenAI: {str(e)}")

async def search_spotify_playlists(token: str, mood: str):
    print(mood)
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.spotify.com/v1/search",
            headers={"Authorization": f"Bearer {token}"},
            params={
                "q": f"{mood} mood",
                "type": "playlist",
                "limit": 1,
            },
        )
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to search Spotify playlists")
        data = response.json()
        if not data["playlists"]["items"]:
            raise HTTPException(status_code=404, detail="No playlists found")
        playlist = data["playlists"]["items"][0]
        return playlist["id"], playlist["name"]

# Endpoints
@app.get("/login")
async def login():
    scopes = [
        "streaming",
        "user-read-email",
        "user-read-private",
        "playlist-read-private",
        "user-read-playback-state",
        "user-modify-playback-state"
    ]
    auth_url = f"https://accounts.spotify.com/authorize?client_id={SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri={SPOTIFY_REDIRECT_URI}&scope={' '.join(scopes)}"
    return {"auth_url": auth_url}

@app.get("/callback")
async def callback(code: str):
    token = await get_spotify_token(code)
    frontend_url = "http://localhost:5173"  # Your React app URL
    return RedirectResponse(f"{frontend_url}?access_token={token}")

@app.post("/get-playlist", response_model=PlaylistResponse)
async def get_playlist(location: Location, token: str = Depends(oauth2_scheme)):
    weather_data = await get_weather_data(location)
    mood = await get_mood_from_weather(weather_data)
    playlist_id, playlist_name = await search_spotify_playlists(token, mood)
    return PlaylistResponse(playlist_id=playlist_id, playlist_name=playlist_name)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

# uvicorn sonify:app --reload