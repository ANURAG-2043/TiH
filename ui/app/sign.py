import os
import cv2
import numpy as np
import mediapipe as mp
from tensorflow.keras.models import load_model

# Load the model
model_path = os.path.join(os.path.dirname(__file__), 'models', 'cnn_model.h5')
model = load_model(model_path)
print("Model loaded successfully.")

# Mediapipe hands setup
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=False, max_num_hands=2, min_detection_confidence=0.5)

# Drawing specifications for landmarks and connections
mp_drawing = mp.solutions.drawing_utils
landmark_spec = mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=5)  # Green landmarks
connection_spec = mp_drawing.DrawingSpec(color=(0, 0, 0), thickness=3)  

labels_dict = {
    0: 'Hello', 1: 'Okay', 2: 'Poor', 3: 'I Love You', 
    4: 'Help', 5: 'What', 6: 'Happy', 7: 'Good', 
    8: 'Promise', 9: 'No'
}

detected_gestures = []
last_detected_gesture = None
current_gesture = ""


def generate_frames():
    global last_detected_gesture
    
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open video capture device.")
        return

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Error: Failed to capture image.")
            break

        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(frame_rgb)

        detected_gesture = "No Hands"
        
        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                data_aux = []
                for landmark in hand_landmarks.landmark:
                    data_aux.extend([landmark.x, landmark.y])

                if len(data_aux) < 84:
                    data_aux += [0] * (84 - len(data_aux))

                try:
                    prediction = model.predict(np.array([data_aux[:84]]).astype(np.float32))
                    detected_class = np.argmax(prediction)
                    detected_gesture = labels_dict.get(detected_class, "Unknown")
                    
                    if detected_gesture != last_detected_gesture:
                        detected_gestures.append(detected_gesture)
                        last_detected_gesture = detected_gesture
                        current_gesture = detected_gesture 
                    
                        # Print the gesture and the updated list
                        print(f"Detected Gesture: {detected_gesture}")
                        print(f"Gesture History: {detected_gestures}")
                    
                except Exception as e:
                    print(f"Prediction error: {e}")
                    detected_gesture = "Error"

                mp_drawing.draw_landmarks(
                    frame, 
                    hand_landmarks, 
                    mp_hands.HAND_CONNECTIONS, 
                    landmark_spec, 
                    connection_spec
                )

                x_min = int(min([lm.x for lm in hand_landmarks.landmark]) * frame.shape[1])
                y_min = int(min([lm.y for lm in hand_landmarks.landmark]) * frame.shape[0])
                cv2.putText(frame, detected_gesture, (x_min, y_min - 10), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)

        ret, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()
        if not ret:
            print("Error: Frame encoding failed.")
            break

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

    cap.release()

    