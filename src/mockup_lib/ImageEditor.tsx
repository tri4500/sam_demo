import React, { useState, useEffect, useContext } from "react";
import { useDrop } from "react-dnd";
import { NativeTypes } from "react-dnd-html5-backend";
import { doMockup } from "./tshirt-mockup";
import { MockupInput } from "./MockupInput";
import { ImageFile } from "./ImageFile";
import AppContext from "../components/hooks/createContext";
import { BwMaskGen } from "./BwMaskGen";

const ImageEditor = () => {
  const [bgImgName, setBgImgName] = useState<string | null>(null);
  const [overlayImage, setOverlayImage] = useState<string[]>([]);
  const [overlayImgName, setOverlayImgName] = useState<string[]>([]);
  const [overlayPosition, setOverlayPosition] = useState<any[]>([]);
  const [isDrag, setIsDrag] = useState<boolean>(false);
  const [editorSize, setEditorSize] = useState({ width: 0, height: 0 });
  const [displace, setDisplace] = useState<number[]>([]);
  const [lighting, setLighting] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [resultImgUrl, setResultImgUrl] = useState<string | null>(null);

  const {
    image: [image],
    listWhiteMaskImg: [listWhiteMaskImg],
    maskNumber: [maskNumber],
  } = useContext(AppContext)!;

  useEffect(() => {
    if (image) {
      const img = new Image();
      img.src = image.src;
      img.onload = () => {
        setEditorSize({ width: img.width, height: img.height });
      };
      setBgImgName("temp.abc");
    }
  }, [image]);

  useEffect(() => {
    setOverlayImgName(Array(maskNumber).fill(""));
    setOverlayImage(Array(maskNumber).fill(""));
    setOverlayPosition(Array(maskNumber).fill({ x: 0, y: 0 }));
    setDisplace(Array(maskNumber).fill(10));
    setLighting(Array(maskNumber).fill(20));
  }, [maskNumber]);

  const handleOverlayImageChange = (event: any) => {
    const file = event.target.files[0];
    const tempImgName = [...overlayImgName];
    tempImgName[currentIndex] = file.name;
    setOverlayImgName(tempImgName);
    const tempImg = [...overlayImage];
    tempImg[currentIndex] = URL.createObjectURL(file);
    setOverlayImage(tempImg);
  };

  const [, dropRef] = useDrop({
    accept: NativeTypes.FILE,
    drop(item: any, monitor) {
      if (monitor) {
        const files: File[] = (monitor.getItem() as any).files;
        const tempImg = [...overlayImage];
        tempImg[currentIndex] = URL.createObjectURL(files[0]);
        setOverlayImage(tempImg);
      }
    },
  });

  const handleOverlayDrag = (event: any) => {
    if (isDrag) {
      console.log("Drag");
      const tempPosList = [...overlayPosition];
      tempPosList[currentIndex] = {
        x: event.clientX,
        y: event.clientY,
      };
      setOverlayPosition(tempPosList);
    }
  };

  const handleOnClick = () => {
    setIsDrag(!isDrag);
  };

  const handleDisplaceSliderChange = (event: any) => {
    const tempDisplace = [...displace];
    tempDisplace[currentIndex] = event.target.value;
    setDisplace(tempDisplace);
  };

  const handleLightingSliderChange = (event: any) => {
    const tempLighting = [...lighting];
    tempLighting[currentIndex] = event.target.value;
    setLighting(tempLighting);
  };

  async function handleOnDoMagickClick() {
    if (!image || !overlayImage) {
      return;
    }
    setResultImgUrl(null);
    const overlayImgList: any[] = [];
    for (let i = 0; i < maskNumber; i++) {
      const tempImg = document.getElementById(
        `overlay-img-${i}`
      ) as HTMLImageElement;
      if (tempImg === null) {
        overlayImgList.push(null);
      } else {
        overlayImgList.push({
          naturalWidth: tempImg.naturalWidth,
          naturalHeight: tempImg.naturalHeight,
        });
      }
    }
    var imageUrl: string = "";
    setIsLoading(true);
    for (let i = 0; i < maskNumber; i++) {
      if (overlayImage[i] === "") {
        console.log("skip " + i);
        continue;
      }
      console.log("process: " + i);
      const placeX = overlayPosition[i].x;
      const placeY = overlayPosition[i].y;
      const overlayImg = overlayImgList[i];
      if (overlayImg === null) {
        continue;
      }
      const placeW = overlayImg.naturalWidth;
      const placeH = overlayImg.naturalHeight;
      const fetchedModelImage =
        imageUrl === "" ? await fetch(image.src) : await fetch(imageUrl);
      const modelImgSourceBytes = new Uint8Array(
        await fetchedModelImage.arrayBuffer()
      );
      if (bgImgName == null) {
        continue;
      }
      const modelImage: ImageFile = {
        name: bgImgName,
        content: modelImgSourceBytes,
      };

      const fetchedLogoImage = await fetch(overlayImage[i]);
      const logoImgSourceBytes = new Uint8Array(
        await fetchedLogoImage.arrayBuffer()
      );
      if (overlayImgName[i] == null) {
        continue;
      }
      const logoImage: ImageFile = {
        name: overlayImgName[i],
        content: logoImgSourceBytes,
      };

      let maskImageData: ImageFile | undefined = undefined;
      if (listWhiteMaskImg !== null && listWhiteMaskImg.length > 0) {
        const fetchSamMaskImg = await fetch(listWhiteMaskImg[i].src);
        const samMaskSourceByte = new Uint8Array(
          await fetchSamMaskImg.arrayBuffer()
        );
        const newMaskImg = await BwMaskGen("sam_mask.png", samMaskSourceByte);
        const bwMaskImageUrl = URL.createObjectURL(newMaskImg);
        const fetchedMaskImage = await fetch(bwMaskImageUrl);
        const maskImgSourceBytes = new Uint8Array(
          await fetchedMaskImage.arrayBuffer()
        );
        maskImageData = {
          name: "bw_mask.png",
          content: maskImgSourceBytes,
        };
      }

      const temp = new MockupInput();
      temp.bgImage = modelImage;
      temp.logoImage = logoImage;
      temp.maskImage = maskImageData;
      temp.placeX = placeX;
      temp.placeY = placeY;
      temp.placeW = placeW;
      temp.placeH = placeH;
      temp.displace = displace[i];
      temp.lighting = lighting[i];
      const res = await doMockup(temp);
      imageUrl = URL.createObjectURL(res);
    }
    if (imageUrl !== "") {
      setResultImgUrl(imageUrl);
    }
    setIsLoading(false);
  }

  const generateNumberOptions = (range: number) => {
    const options = [];
    for (let i = 0; i < range; i++) {
      options.push(
        <option key={i} value={i}>
          {i}
        </option>
      );
    }
    return options;
  };

  const generateOverlayImages = (
    range: number,
    _overlayImage: string[],
    _overlayPosition: any[]
  ) => {
    if (_overlayImage.length === 0 || _overlayPosition.length === 0) {
      return [];
    }
    const imgs = [];
    for (let i = 0; i < range; i++) {
      if (_overlayImage[i] !== "") {
        imgs.push(
          <img
            src={_overlayImage[i]}
            alt="Overlay"
            id={`overlay-img-${i}`}
            style={{
              position: "absolute",
              top: `${overlayPosition[i].y}px`,
              left: `${overlayPosition[i].x}px`,
              width: "auto",
              height: "auto",
              pointerEvents: "none",
            }}
          />
        );
      }
    }
    return imgs;
  };

  const generateMaskIndexChange = (event: any) => {
    setCurrentIndex(event.target.value);
  };

  if (isLoading) {
    return <h1>PROCESSING.... PLEASE WAIT...</h1>;
  } else {
    return (
      <div onMouseMove={handleOverlayDrag}>
        <div>
          <h2>Image Editor</h2>
          <div>
            <select value={currentIndex} onChange={generateMaskIndexChange}>
              {generateNumberOptions(maskNumber)}
            </select>
            <p>Selected index: {currentIndex}</p>
          </div>
          <div>
            <label htmlFor="overlay-image">Choose Overlay Image:</label>
            <input
              type="file"
              id="overlay-image"
              accept="image/*"
              onChange={handleOverlayImageChange}
            />
          </div>
          <div>
            <input
              type="range"
              min="0"
              max="20"
              value={displace[currentIndex]}
              onChange={handleDisplaceSliderChange}
            />
            <p>Độ biến dạng theo áo: {displace[currentIndex]}</p>
          </div>
          <div>
            <input
              type="range"
              min="-100"
              max="100"
              value={lighting[currentIndex]}
              onChange={handleLightingSliderChange}
            />
            <p>Độ trong suốt của hình in: {lighting[currentIndex]}</p>
          </div>
          <div
            ref={dropRef}
            id="bg"
            style={{
              position: "relative",
              width: editorSize.width,
              height: editorSize.height,
              border: "1px solid black",
              backgroundImage: `url(${image?.src})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              cursor: "pointer",
            }}
            // onMouseMove={handleOverlayDrag}
            onClick={handleOnClick}
          >
            {generateOverlayImages(maskNumber, overlayImage, overlayPosition)}
          </div>
        </div>
        <div>
          <button onClick={handleOnDoMagickClick}>Do Magick</button>
          {resultImgUrl && <img src={resultImgUrl} />}
        </div>
      </div>
    );
  }
};

export default ImageEditor;
