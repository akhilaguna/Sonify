# Sonify - Personalized Music Recommendation Based on Weather Conditions

Sonify is a web application that provides personalized music recommendations by integrating weather data to curate mood-based playlists. The app leverages various APIs to deliver a unique listening experience by suggesting Spotify playlists based on the current weather in the user's location. With Sonify, music is no longer just a personal preference—it's influenced by the environment.

## Features

- **Spotify Integration**: Users can log in with their Spotify accounts and listen to recommended playlists directly through the app.
- **Weather-Based Music Recommendations**: Utilizes the OpenWeatherMap API to fetch weather data and suggest playlists that match the mood likely invoked by the current weather.
- **Mood Analysis**: Uses the OpenAI API to analyze weather data and predict the mood associated with it, then fetches Spotify playlists that suit that mood.
- **Location-Based Personalization**: Retrieves the user's current location to provide localized weather data and music recommendations.
- **Spotify Web Playback SDK Integration**: Allows for seamless playback of the recommended music within the app, maintaining a smooth user experience.

## How It Works

1. **User Login**: The user logs in via their Spotify account, granting access to their music library and playback capabilities.
2. **Location Retrieval**: The app fetches the user's current location to gather local weather data using the OpenWeatherMap API.
3. **Weather Data Processing**: The fetched weather data (e.g., temperature, humidity, weather conditions) is sent to the custom OpenAI assistant.
4. **Mood Determination**: The OpenAI assistant processes the weather data and returns a mood classification (e.g., "chill," "energetic," "melancholic").
5. **Playlist Recommendation**: Based on the determined mood, the app uses Spotify's search endpoint to find playlists that match the mood and minimizes chances of recommending the same playlist to multiple users simultaneously.
6. **Music Playback**: The recommended playlist is played using the Spotify Web Playback SDK integrated within the app.

## Tech Stack

- **Frontend**: React
- **Backend**: FastAPI
- **APIs Used**:
  - [Spotify Web API](https://developer.spotify.com/documentation/web-api/)
  - [Spotify Web Playback SDK](https://developer.spotify.com/documentation/web-playback-sdk/)
  - [OpenWeatherMap API](https://openweathermap.org/api)
  - [OpenAI API](https://beta.openai.com/)

## Prerequisites

- **Node.js** and **npm/yarn** for the frontend development
- **Python 3.7+** and **FastAPI** for the backend
- **Spotify Developer Account** to register your app and obtain client credentials
- **API Keys** for OpenWeatherMap and OpenAI

## Set Up Environment Variables

Create a `.env` file in both the `frontend` and `backend` directories with the necessary API keys and Spotify credentials.

## Getting Started

1. **Clone the Repository**:
   git clone https://github.com/your-username/sonify.git

2. **Install Python Requirements**:
   cd FastAPI  
   pip install -r requirements.txt

3. **Run the FastAPI App**:
   uvicorn sonify:app --reload

4. **npm intall**:
   cd ../sonify  
   npm install

5. **Run the React App**
   npm run dev

## Future Enhancements

- **User Preference Learning**: Incorporate machine learning to improve music recommendations based on user feedback.
- **Support for Multiple Music Services**: Expand to other streaming platforms besides Spotify.
- **Offline Mode**: Offer a limited functionality offline mode with local caching.
