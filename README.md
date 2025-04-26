
# beats.ai 🌌🎵

A Flask web app with:
- Glowing golden-ratio reactive starfield
- Microphone band-split reactivity
- Spotify login to fetch song info
- Dynamic color shifting based on track mood
- Supernovae on loud bursts!

## Setup Instructions

1. Clone or unzip this repo.
2. Create a [Spotify Developer App](https://developer.spotify.com/dashboard/).
3. Copy your `Client ID`, `Client Secret`, and set the redirect URI to `http://localhost:5000/callback`
4. Fill out `.env` file (copy `.env.example`).
5. Install requirements:

```bash
pip install -r requirements.txt
```

6. Run the server:

```bash
python app.py
```

7. Visit `http://localhost:5000` and enjoy!

## Notes
- Mic access required for real-time audio reactivity.
- Spotify access is optional but enriches the color shifting.
