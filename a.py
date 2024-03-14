from flask import Flask, request, jsonify
from flask_restful import Resource, Api
from werkzeug.utils import secure_filename
import cv2
import numpy as np
import io
import tempfile
import os

app = Flask(_name_)
api = Api(app)

# Import your object detection function here
from main3 import run_object_detection

class UploadImage(Resource):
    def post(self):
        if 'image' not in request.files:
            return jsonify({"error": "No image part"})
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({"error": "No image selected for uploading"})
        
        filename = secure_filename(file.filename)
        # Save the file to a temporary file
        temp_dir = tempfile.mkdtemp()
        temp_path = os.path.join(temp_dir, filename)
        file.save(temp_path)
        print(file)
        # Run object detection on the saved image
        # Adjust the parameters according to your needs
        detection_results = run_object_detection(
            source=temp_path,
        )
        
        # Clean up the temporary file
        os.remove(temp_path)
        os.rmdir(temp_dir)
        
        return jsonify({"filename": filename, "detections": detection_results})

api.add_resource(UploadImage, '/upload-image')

if _name_ == '_main_':
    app.run(host='0.0.0.0', port=5000)