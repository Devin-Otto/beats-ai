
import os
from flask import Flask, render_template, redirect, request, session, jsonify
import requests
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY')

SPOTIFY_CLIENT_ID = os.getenv('SPOTIFY_CLIENT_ID')
SPOTIFY_CLIENT_SECRET = os.getenv('SPOTIFY_CLIENT_SECRET')
SPOTIFY_REDIRECT_URI = os.getenv('SPOTIFY_REDIRECT_URI')

def get_spotify_auth_url():
    scopes = "user-read-currently-playing"
    return (
        f"https://accounts.spotify.com/authorize"
        f"?client_id={SPOTIFY_CLIENT_ID}"
        f"&response_type=code"
        f"&redirect_uri={SPOTIFY_REDIRECT_URI}"
        f"&scope={scopes}"
    )

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login')
def login():
    return redirect(get_spotify_auth_url())

@app.route('/callback')
def callback():
    code = request.args.get('code')
    response = requests.post(
        'https://accounts.spotify.com/api/token',
        data={
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': SPOTIFY_REDIRECT_URI,
            'client_id': SPOTIFY_CLIENT_ID,
            'client_secret': SPOTIFY_CLIENT_SECRET
        }
    )
    data = response.json()
    session['access_token'] = data['access_token']
    return redirect('/')

@app.route('/current_track')
def current_track():
    access_token = session.get('access_token')
    if not access_token:
        return jsonify({'error': 'Not logged in'}), 401

    headers = {'Authorization': f'Bearer {access_token}'}
    response = requests.get('https://api.spotify.com/v1/me/player/currently-playing', headers=headers)
    
    if response.status_code != 200:
        return jsonify({'error': 'Failed to fetch'}), response.status_code

    data = response.json()
    if not data or not data.get('item'):
        return jsonify({'error': 'No track playing'}), 404

    track = {
        'name': data['item']['name'],
        'artist': data['item']['artists'][0]['name'],
        'energy': None,
        'danceability': None
    }

    track_id = data['item']['id']
    audio_features = requests.get(
        f'https://api.spotify.com/v1/audio-features/{track_id}',
        headers=headers
    ).json()

    track['energy'] = audio_features.get('energy')
    track['danceability'] = audio_features.get('danceability')

    return jsonify(track)

if __name__ == '__main__':
    app.run(debug=True)
