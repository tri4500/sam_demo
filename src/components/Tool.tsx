// Copyright (c) Meta Platforms, Inc. and affiliates.
// All rights reserved.

// This source code is licensed under the license found in the
// LICENSE file in the root directory of this source tree.

import React, { useContext, useEffect, useState } from "react";
import AppContext from "./hooks/createContext";
import { ToolProps } from "./helpers/Interfaces";
import * as _ from "underscore";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import ImageEditor from "../mockup_lib/ImageEditor";

const Tool = ({ handleMouseMove }: ToolProps) => {
  const {
    image: [image],
    maskImg: [maskImg, setMaskImg],
    listMaskImg: [listMaskImg, setListMaskImg],
    whiteMaskImg: [whiteMaskImg, setWhiteMaskImg],
    listWhiteMaskImg: [listWhiteMaskImg, setListWhiteMaskImg],
    printingStep: [, setPrintingStep],
    maskNumber: [maskNumber],
  } = useContext(AppContext)!;

  // Determine if we should shrink or grow the images to match the
  // width or the height of the page and setup a ResizeObserver to
  // monitor changes in the size of the page
  const [shouldFitToWidth, setShouldFitToWidth] = useState(true);
  const [IsSecondProcess, setIsSecondProcess] = useState(false);
  const bodyEl = document.body;
  const fitToPage = () => {
    if (!image) return;
    const imageAspectRatio = image.width / image.height;
    const screenAspectRatio = window.innerWidth / window.innerHeight;
    setShouldFitToWidth(imageAspectRatio > screenAspectRatio);
  };
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (entry.target === bodyEl) {
        fitToPage();
      }
    }
  });
  useEffect(() => {
    fitToPage();
    resizeObserver.observe(bodyEl);
    return () => {
      resizeObserver.unobserve(bodyEl);
    };
  }, [image]);

  const imageClasses = "";
  const maskImageClasses = `absolute opacity-40 pointer-events-none`;

  const handleMouseClick = () => {
    if (maskImg === null || whiteMaskImg == null) return;
    const temp: HTMLImageElement[] = listMaskImg == null ? [] : listMaskImg;
    if (temp.length >= maskNumber) {
      return;
    }
    temp.push(maskImg);
    setListMaskImg(temp);
    const temp2: HTMLImageElement[] =
      listWhiteMaskImg == null ? [] : listWhiteMaskImg;
    temp2.push(whiteMaskImg);
    setListWhiteMaskImg(temp2);
  };

  const handleKeyPress = (event: any) => {
    event.preventDefault();
    console.log("RIGHT MOUSE CLICK");
    setPrintingStep(true);
  };

  // Render the image and the predicted mask image on top
  return (
    <>
      {image && (
        <img
          onMouseMove={handleMouseMove}
          onMouseOut={() =>
            (_ as any).defer(() => {
              setMaskImg(null);
              setWhiteMaskImg(null);
            })
          }
          onClick={handleMouseClick}
          onTouchStart={handleMouseMove}
          onContextMenu={handleKeyPress}
          src={image.src}
          className={`${
            shouldFitToWidth ? "w-full" : "h-full"
          } ${imageClasses}`}
        ></img>
      )}
      {listMaskImg &&
        listMaskImg.length > 0 &&
        listMaskImg.map((mask) => (
          <img
            src={mask.src}
            className={`${
              shouldFitToWidth ? "w-full" : "h-full"
            } ${maskImageClasses}`}
          ></img>
        ))}
      {maskImg && (
        <img
          src={maskImg.src}
          className={`${
            shouldFitToWidth ? "w-full" : "h-full"
          } ${maskImageClasses}`}
        ></img>
      )}
    </>
  );
};

export default Tool;
