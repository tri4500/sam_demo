// Copyright (c) Meta Platforms, Inc. and affiliates.
// All rights reserved.

// This source code is licensed under the license found in the
// LICENSE file in the root directory of this source tree.

import { InferenceSession, Tensor } from "onnxruntime-web";
import React, { useContext, useEffect, useState } from "react";
import "./assets/scss/App.scss";
import { handleImageScale } from "./components/helpers/scaleHelper";
import { modelScaleProps } from "./components/helpers/Interfaces";
import { onnxMaskToImage } from "./components/helpers/maskUtils";
import { modelData } from "./components/helpers/onnxModelAPI";
import Stage from "./components/Stage";
import AppContext from "./components/hooks/createContext";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import ImageEditor from "./mockup_lib/ImageEditor";
const ort = require("onnxruntime-web");

// Define image, embedding and model paths
const MODEL_DIR = "/model/sam_onnx_quantized_example.onnx";

const App = () => {
  const {
    clicks: [clicks],
    image: [, setImage],
    maskImg: [, setMaskImg],
    whiteMaskImg: [, setWhiteMaskImg],
    printingStep: [printingStep],
    maskNumber: [maskNumber, setMaskNumber],
  } = useContext(AppContext)!;
  const [model, setModel] = useState<InferenceSession | null>(null); // ONNX model
  const [tensor, setTensor] = useState<Tensor | null>(null); // Image embedding tensor
  const [imageLoaded, setImageLoaded] = useState(false);
  const [onImgLoaded, setOnImgLoaded] = useState(false);

  // The ONNX model expects the input to be rescaled to 1024.
  // The modelScale state variable keeps track of the scale values.
  const [modelScale, setModelScale] = useState<modelScaleProps | null>(null);

  // Initialize the ONNX model. load the image, and load the SAM
  // pre-computed image embedding
  useEffect(() => {
    // Initialize the ONNX model
    const initModel = async () => {
      try {
        if (MODEL_DIR === undefined) return;
        const URL: string = MODEL_DIR;
        const model = await InferenceSession.create(URL);
        setModel(model);
      } catch (e) {
        console.log(e);
      }
    };
    initModel();
  }, []);

  const handleBackgroundImageChange = async (event: any) => {
    setOnImgLoaded(true);
    const file = event.target.files[0];
    const url: string = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        const { height, width, samScale } = handleImageScale(img);
        setModelScale({
          height: height, // original image height
          width: width, // original image width
          samScale: samScale, // scaling factor for image which has been resized to longest side 1024
        });
        img.width = width;
        img.height = height;

        setImage(img);
      };

      const response = await fetch(url);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append("file", blob);
      const res = await fetch("http://10.66.51.100:8000/sam/", {
        method: "POST",
        body: formData,
      });
      const segJSON = await res.json();
      const flattenedArray2D: number[][] = segJSON.flat(2);
      const flattenedArray1D: number[] = flattenedArray2D.flatMap((row) => row);
      const tensor = new ort.Tensor(
        "float32",
        flattenedArray1D,
        [1, 256, 64, 64]
      );
      setTensor(tensor);
      setImageLoaded(true);
      setOnImgLoaded(false);
    } catch (error) {
      console.log(error);
    }
  };

  const handleMaskNumberChange = (event: any) => {
    const inputValue = event.target.value;
    // Remove any non-digit characters
    const sanitizedValue = inputValue.replace(/\D/g, "");
    // Ensure the value is a positive integer
    const positiveInteger = parseInt(sanitizedValue, 10) || 0;

    setMaskNumber(positiveInteger);
  };

  // Run the ONNX model every time clicks has changed
  useEffect(() => {
    runONNX();
  }, [clicks]);

  const runONNX = async () => {
    try {
      if (
        model === null ||
        clicks === null ||
        tensor === null ||
        modelScale === null
      )
        return;
      else {
        // Preapre the model input in the correct format for SAM.
        // The modelData function is from onnxModelAPI.tsx.
        const feeds = modelData({
          clicks,
          tensor,
          modelScale,
        });
        if (feeds === undefined) return;
        // Run the SAM ONNX model with the feeds returned from modelData()
        const results = await model.run(feeds);
        const output = results[model.outputNames[0]];
        // The predicted mask returned from the ONNX model is an array which is
        // rendered as an HTML image using onnxMaskToImage() from maskUtils.tsx.
        const { image, maskImage } = onnxMaskToImage(
          output.data,
          output.dims[2],
          output.dims[3]
        );
        setMaskImg(image);
        setWhiteMaskImg(maskImage);
      }
    } catch (e) {
      console.log(e);
    }
  };

  if (imageLoaded) {
    if (printingStep) {
      return (
        <DndProvider backend={HTML5Backend}>
          <ImageEditor />
        </DndProvider>
      );
    } else {
      return <Stage />;
    }
  } else {
    if (onImgLoaded) {
      return (
        <div>
          <h1>PROCESSING IMAGE</h1>
        </div>
      );
    } else {
      return (
        <div>
          <div>
            <label htmlFor="background-image">Choose Background Image:</label>
            <input
              type="file"
              id="background-image"
              accept="image/*"
              onChange={handleBackgroundImageChange}
            />
          </div>
          <div>
            <p>Choose number of mask:</p>
            <input
              type="number"
              value={maskNumber}
              onChange={handleMaskNumberChange}
            />
          </div>
        </div>
      );
    }
  }
};

export default App;
