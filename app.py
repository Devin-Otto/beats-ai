from flask import Flask, request, redirect, jsonify, render_template
import requests, os
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY")

CURRENT_ACCESS_TOKEN = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login')
def login():
    auth_url = "https://accounts.spotify.com/authorize"
    params = {
        "client_id": os.getenv("SPOTIFY_CLIENT_ID"),
        "response_type": "code",
        "redirect_uri": os.getenv("SPOTIFY_REDIRECT_URI"),
        "scope": "user-read-currently-playing"
    }
    url = f"{auth_url}?{'&'.join([f'{k}={v}' for k,v in params.items()])}"
    return redirect(url)

@app.route('/callback')
def callback():
    global CURRENT_ACCESS_TOKEN
    code = request.args.get('code')
    token_url = 'https://accounts.spotify.com/api/token'
    payload = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': os.getenv("SPOTIFY_REDIRECT_URI"),
        'client_id': os.getenv("SPOTIFY_CLIENT_ID"),
        'client_secret': os.getenv("SPOTIFY_CLIENT_SECRET")
    }
    response = requests.post(token_url, data=payload)
    data = response.json()
    CURRENT_ACCESS_TOKEN = data.get('access_token')
    return redirect('/')

@app.route('/nowplaying')
def now_playing():
    global CURRENT_ACCESS_TOKEN
    if not CURRENT_ACCESS_TOKEN:
        return jsonify({'error': 'Not streaming yet'}), 403

    headers = {'Authorization': f'Bearer {CURRENT_ACCESS_TOKEN}'}
    response = requests.get('https://api.spotify.com/v1/me/player/currently-playing', headers=headers)

    if response.status_code != 200:
        return jsonify({'error': 'Playback info not available'}), 404

    song = response.json()
    return jsonify({
        'title': song['item']['name'],
        'artist': song['item']['artists'][0]['name'],
        'album': song['item']['album']['name'],
        'cover': song['item']['album']['images'][0]['url'],
        'progress_ms': song['progress_ms'],
        'duration_ms': song['item']['duration_ms'],
        'is_playing': song['is_playing']
    })

if __name__ == '__main__':
    app.run(debug=True)