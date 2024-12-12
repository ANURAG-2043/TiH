from flask import Blueprint, render_template, request, jsonify, Response
from googletrans import Translator
from .sign import generate_frames,current_gesture, detected_gestures, last_detected_gesture

main = Blueprint('main', __name__)
translator = Translator()

@main.route('/')
def index():
    return render_template('index.html')

@main.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@main.route('/get_gestures', methods =['GET'])
def get_gesture():
    return jsonify({"gesture": detected_gestures})

@main.route('/translate', methods=['POST'])
def translate():
    data = request.get_json()

    text = data.get('text')
    language = data.get('language')

    if not text or not language:
        return jsonify({"error": "Text and language are required"}), 400

    try:
        translated = translator.translate(text, dest=language)
        return jsonify({"translated_text": translated.text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500





