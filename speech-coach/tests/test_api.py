import json
import io
import wave

from fastapi.testclient import TestClient

from speech_coach.serving.api import app

client = TestClient(app)


def _silent_wav_bytes(duration_sec: float = 0.2, sr: int = 16000) -> bytes:
    buf = io.BytesIO()
    n = int(sr * duration_sec)
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(b"\x00\x00" * n)
    return buf.getvalue()


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_analyze_stub():
    wav = _silent_wav_bytes()
    files = {"audio": ("t.wav", wav, "audio/wav")}
    data = {
        "target_word": "사과",
        "target_phonemes": json.dumps(["s", "a", "g", "w", "a"]),
    }
    r = client.post("/v1/utterance/analyze", files=files, data=data)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["pcc"] == 100.0
    assert len(body["phoneme_results"]) == 5


def test_analyze_auto_phonemes_from_word():
    wav = _silent_wav_bytes()
    files = {"audio": ("t.wav", wav, "audio/wav")}
    data = {"target_word": "사과", "target_phonemes": ""}
    r = client.post("/v1/utterance/analyze", files=files, data=data)
    assert r.status_code == 200, r.text
    assert len(r.json()["phoneme_results"]) >= 1
