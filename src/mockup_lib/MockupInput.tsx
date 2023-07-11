import { ImageFile } from "./ImageFile";

export class MockupInput {
  bgImage: ImageFile = {
    name: "temp",
    content: new Uint8Array(),
  };
  logoImage: ImageFile = {
    name: "temp",
    content: new Uint8Array(),
  };
  maskImage: ImageFile | undefined = undefined;
  isAlpha: boolean | undefined = undefined;
  tempA: ImageFile | undefined = undefined;
  tempACache: ImageFile | undefined = undefined;
  tempL: ImageFile | undefined = undefined;
  tempLCache: ImageFile | undefined = undefined;
  tempD: ImageFile | undefined = undefined;
  tempDCache: ImageFile | undefined = undefined;
  placeX = 0;
  placeY = 0;
  placeW = 0;
  placeH = 0;
  fit = "none";
  gravity = "center";
  vshift = 0;
  offset = "";
  rotate = 0;
  lighting = 20;
  blur = 1;
  displace = 10;
  sharpen = 1;
  antialias = 2;
  attenuate = 0;
  brightness = 0;
  saturation = 0;
  compose = "hardlight";
  opacity = 100;
}
