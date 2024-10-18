import React, { useState, useEffect } from 'react'; 
import { Button, Card, CardBody, CardTitle, CardHeader } from 'reactstrap';
import SonifyPlayer from './SonifyPlayer';
import 'bootstrap/dist/css/bootstrap.min.css';
import './SonifyHome.css'; // Import the custom CSS

const API_BASE_URL = 'http://localhost:8000';

export default function SonifyHome() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('access_token');
    if (token) {
      setAccessToken(token);
      setIsLoggedIn(true);
      localStorage.setItem('spotify_access_token', token);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      const storedToken = localStorage.getItem('spotify_access_token');
      if (storedToken) {
        setAccessToken(storedToken);
        setIsLoggedIn(true);
      }
    }
  }, []);

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`);
      const data = await response.json();
      window.location.href = data.auth_url;
    } catch (error) {
      console.error('Failed to initiate login:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('spotify_access_token');
    setAccessToken(null);
    setIsLoggedIn(false);
    alert("Logged Out: You have been successfully logged out.");
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-4">
      <Card className="w-100" style={{ maxWidth: '500px' }}>
        <CardHeader>
          <CardTitle tag="h2" className="text-center">Welcome to Sonify</CardTitle>
        </CardHeader>
        <CardBody>
          {!isLoggedIn ? (
            <div className="text-center">
              <p className="mb-4">Experience music that matches your weather. Login with Spotify to get started.</p>
              <Button color="primary" onClick={handleLogin}>Login with Spotify</Button>
            </div>
          ) : (
            <>
              <SonifyPlayer accessToken={accessToken!} />
              <div className="mt-4 text-center">
                <Button onClick={handleLogout} variant="outline">Logout</Button>
              </div>
              </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
