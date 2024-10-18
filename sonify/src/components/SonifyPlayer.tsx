import React, { useState, useEffect } from 'react';
import { Button, Card, CardBody, CardTitle, CardHeader, Spinner, Alert } from 'reactstrap';
import { PlayFill, PauseFill, SkipStartFill, SkipEndFill } from 'react-bootstrap-icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import './SonifyPlayer.css';

const API_BASE_URL = 'http://localhost:8000';

interface SonifyPlayerProps {
  accessToken: string;
}

export default function SonifyPlayer({ accessToken }: SonifyPlayerProps) {
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Spotify.Track | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<'success' | 'danger' | null>(null);
  const [playerReady, setPlayerReady] = useState(false);

  useEffect(() => {
    const initializePlayer = () => {
      if (!window.Spotify) {
        console.error('Spotify SDK not loaded.');
        return;
      }

      const newPlayer = new window.Spotify.Player({
        name: 'Sonify Web Player',
        getOAuthToken: (cb) => {
          cb(accessToken);
        },
        volume: 1,
      });

      newPlayer.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
        setPlayerReady(true);
      });

      newPlayer.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
        setPlayerReady(false);
      });

      newPlayer.addListener('player_state_changed', (state) => {
        if (state) {
          setCurrentTrack(state.track_window.current_track);
          setIsPlaying(!state.paused);
        }
      });

      newPlayer.connect();
      setPlayer(newPlayer);
    };

    if (!window.onSpotifyWebPlaybackSDKReady) {
      window.onSpotifyWebPlaybackSDKReady = initializePlayer;
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);
    } else {
      initializePlayer();
    }

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, [accessToken]);

  const handlePlayPause = async () => {
    if (!player || !playerReady) {
      showAlert('Player is not ready. Please wait and try again.', 'danger');
      return;
    }

    try {
      const state = await player.getCurrentState();
      if (state) {
        if (state.paused) {
          await player.resume();
          setIsPlaying(true);
        } else {
          await player.pause();
          setIsPlaying(false);
        }
      } else {
        await fetchAndPlayPlaylist();
      }
    } catch (error) {
      console.error('Error in handlePlayPause:', error);
      showAlert('There was an error controlling the playback. Please try again.', 'danger');
    }
  };

  const handleNextTrack = async () => {
    if (!player || !playerReady) {
      showAlert('Player is not ready. Please wait and try again.', 'danger');
      return;
    }

    try {
      await player.nextTrack();
    } catch (error) {
      console.error('Error in handleNextTrack:', error);
      showAlert('There was an error skipping to the next track. Please try again.', 'danger');
    }
  };

  const handlePreviousTrack = async () => {
    if (!player || !playerReady) {
      showAlert('Player is not ready. Please wait and try again.', 'danger');
      return;
    }

    try {
      await player.previousTrack();
    } catch (error) {
      console.error('Error in handlePreviousTrack:', error);
      showAlert('There was an error skipping to the previous track. Please try again.', 'danger');
    }
  };

  const fetchAndPlayPlaylist = async () => {
    if (!deviceId) {
      showAlert('No device ID found. Please make sure the web player is ready.', 'danger');
      return;
    }

    setIsLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const response = await fetch(`${API_BASE_URL}/get-playlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch playlist');
      }

      const data = await response.json();
      const playlistUri = `spotify:playlist:${data.playlist_id}`;

      await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play: true,
        }),
      });

      await fetch(`https://api.spotify.com/v1/me/player/play`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          context_uri: playlistUri,
        }),
      });
      setIsPlaying(true);
      showAlert(`Now playing: ${data.playlist_name}`, 'success');
    } catch (error) {
      console.error('Error in fetchAndPlayPlaylist:', error);
      showAlert('There was an error fetching or playing the playlist. Please try again.', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  const showAlert = (message: string, type: 'success' | 'danger') => {
    setAlertMessage(message);
    setAlertType(type);

    setTimeout(() => {
      setAlertMessage(null);
      setAlertType(null);
    }, 5000);
  };

  return (
    <div>
      {alertMessage && (
        <Alert color={alertType} className="text-center">
          {alertMessage}
        </Alert>
      )}
      <Card className="w-100 mx-auto" style={{ maxWidth: '500px' }}>
        <CardHeader>
          <CardTitle tag="h3" className="text-center">
            Sonify Player
          </CardTitle>
        </CardHeader>
        <CardBody className="d-flex flex-column align-items-center">
          {currentTrack && (
            <div className="mb-4 text-center">
              <p className="font-weight-bold">{currentTrack.name}</p>
              <p className="text-muted">{currentTrack.artists[0].name}</p>
            </div>
          )}
          <div className="d-flex justify-content-center align-items-center mb-3">
            <Button
              color="secondary"
              onClick={handlePreviousTrack}
              disabled={isLoading || !playerReady}
              className="rounded-circle mx-2 button"
              style={{ width: '3rem', height: '3rem' }}
            >
              <SkipStartFill size={24} />
            </Button>
            <Button
              color="primary"
              onClick={handlePlayPause}
              disabled={isLoading || !playerReady}
              className="rounded-circle mx-2 button"
              style={{ width: '4rem', height: '4rem' }}
            >
              {isLoading ? <Spinner size="sm" /> : isPlaying ? <PauseFill size={32} /> : <PlayFill size={32} />}
            </Button>
            <Button
              color="secondary"
              onClick={handleNextTrack}
              disabled={isLoading || !playerReady}
              className="rounded-circle mx-2 button"
              style={{ width: '3rem', height: '3rem' }}
            >
              <SkipEndFill size={24} />
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}