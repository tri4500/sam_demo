// Copyright (c) Meta Platforms, Inc. and affiliates.
// All rights reserved.

// This source code is licensed under the license found in the
// LICENSE file in the root directory of this source tree.

import React, { useState } from "react";
import { modelInputProps } from "../helpers/Interfaces";
import AppContext from "./createContext";

const AppContextProvider = (props: {
  children: React.ReactElement<any, string | React.JSXElementConstructor<any>>;
}) => {
  const [clicks, setClicks] = useState<Array<modelInputProps> | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [maskImg, setMaskImg] = useState<HTMLImageElement | null>(null);
  const [listMaskImg, setListMaskImg] = useState<HTMLImageElement[] | null>(
    null
  );
  const [whiteMaskImg, setWhiteMaskImg] = useState<HTMLImageElement | null>(
    null
  );
  const [listWhiteMaskImg, setListWhiteMaskImg] = useState<
    HTMLImageElement[] | null
  >(null);
  const [printingStep, setPrintingStep] = useState<boolean>(false);
  const [maskNumber, setMaskNumber] = useState<number>(1);

  return (
    <AppContext.Provider
      value={{
        clicks: [clicks, setClicks],
        image: [image, setImage],
        maskImg: [maskImg, setMaskImg],
        listMaskImg: [listMaskImg, setListMaskImg],
        whiteMaskImg: [whiteMaskImg, setWhiteMaskImg],
        listWhiteMaskImg: [listWhiteMaskImg, setListWhiteMaskImg],
        printingStep: [printingStep, setPrintingStep],
        maskNumber: [maskNumber, setMaskNumber],
      }}
    >
      {props.children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
