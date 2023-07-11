import { MockupInput } from "./MockupInput";

export async function doMockup(input: MockupInput) {
  // calculate brightness and saturation
  const Magick = (window as any).magick;
  let bri = 100 + input.brightness;
  let sat = 100 + input.saturation;
  let modulating = `-modulate ${bri},${sat},100`;
  if (input.brightness === 0 && input.saturation === 0) {
    modulating = "";
  }

  // convert logo image into .mpc
  let command = [
    `convert -quiet ${input.logoImage.name} +repage ${modulating} tempI.mpc`,
  ];
  let inputFiles = [
    {
      name: input.logoImage.name,
      content: new Uint8Array(input.logoImage.content),
    },
  ];
  let processedFiles = await Magick.execute({
    inputFiles: inputFiles,
    commands: command,
  });
  let arrayBuffer = processedFiles.outputFiles[0].buffer;
  let arrayBufferCache = processedFiles.outputFiles[1].buffer;
  const tempI = {
    name: "tempI.mpc",
    content: new Uint8Array(arrayBuffer),
  };
  const tempICache = {
    name: "tempI.cache",
    content: new Uint8Array(arrayBufferCache),
  };

  // convert t-shirt image into .mpc
  command = [
    `convert -quiet ${input.bgImage.name} +repage -colorspace sRGB tempT.mpc`,
  ];
  inputFiles = [
    {
      name: input.bgImage.name,
      content: new Uint8Array(input.bgImage.content),
    },
  ];
  processedFiles = await Magick.execute({
    inputFiles: inputFiles,
    commands: command,
  });
  arrayBuffer = processedFiles.outputFiles[0].buffer;
  arrayBufferCache = processedFiles.outputFiles[1].buffer;
  const tempT = {
    name: "tempT.mpc",
    content: new Uint8Array(arrayBuffer),
  };
  const tempTCache = {
    name: "tempT.cache",
    content: new Uint8Array(arrayBufferCache),
  };

  // convert mask image into .mpc
  let tempM = undefined;
  let tempMCache = undefined;
  if (input.maskImage !== undefined) {
    command = [`convert -quiet ${input.maskImage.name} +repage tempM.mpc`];
    inputFiles = [
      {
        name: input.maskImage.name,
        content: new Uint8Array(input.maskImage.content),
      },
    ];
    processedFiles = await Magick.execute({
      inputFiles: inputFiles,
      commands: command,
    });
    arrayBuffer = processedFiles.outputFiles[0].buffer;
    arrayBufferCache = processedFiles.outputFiles[1].buffer;
    tempM = {
      name: "tempM.mpc",
      content: new Uint8Array(arrayBuffer),
    };
    tempMCache = {
      name: "tempM.cache",
      content: new Uint8Array(arrayBufferCache),
    };
  }

  // calculate position and dimensions
  let wd = input.placeW;
  let ht = input.placeH;
  let minx = input.placeX;
  let miny = input.placeY;
  if (input.offset !== "") {
    let temp = input.offset.split(":");
    let xx = Number(temp[0]);
    let yy = Number(temp[1]);
    minx = minx + xx;
    miny = miny + yy;
  }
  // let xoffset = minx;
  // let yoffset = miny;
  let topwidth = wd;
  let leftheight = ht;
  // let angle = 0;
  let x1 = minx;
  let y1 = miny;
  let x2 = minx + wd - 1;
  let y2 = miny;
  let x3 = minx + wd - 1;
  let y3 = miny + ht - 1;
  let x4 = minx;
  let y4 = miny + ht - 1;

  let _whInputFile = [
    {
      name: input.logoImage.name,
      content: new Uint8Array(input.logoImage.content),
    },
  ];
  const res = await Magick.execute({
    inputFiles: _whInputFile,
    commands: `identify ${input.logoImage.name}`,
  });
  let temp = res.stdout[0].split(" ")[2];
  temp = temp.split("x");
  let ww = Number(temp[0]);
  let hh = Number(temp[1]);

  let xo1, yo1, xo2, yo2, xo3, yo3, xo4, yo4;

  let scale = 1;
  let scaleflag = "";
  if (input.fit === "scale") {
    if (hh >= ww) {
      scale = (hh - 1) / (leftheight - 1);
    } else {
      scale = (ww - 1) / (topwidth - 1);
    }
  } else if (input.fit === "top") {
    let xscale = (ww - 1) / (topwidth - 1);
    let yscale = (hh - 1) / (leftheight - 1);
    scale = xscale > yscale ? xscale : yscale;
    scaleflag = xscale > yscale ? "x" : "y";
  } else if (input.fit === "crop" || input.fit === "none") {
    scale = (ww - 1) / (topwidth - 1);
  }

  if (input.fit === "distort") {
    xo1 = 0;
    yo1 = 0;
    xo2 = ww - 1;
    yo2 = yo1;
    xo3 = xo2;
    yo3 = hh - 1;
    xo4 = xo1;
    yo4 = yo3;
  } else if (input.fit === "scale") {
    if (hh >= ww) {
      xo1 = Math.round(0.5 * (ww - scale * wd));
      yo1 = 0;
      xo2 = Math.round(xo1 + scale * wd - 1);
      yo2 = yo1;
      xo3 = xo2;
      yo3 = Math.round(yo1 + scale * ht - 1);
      xo4 = xo1;
      yo4 = yo3;
    } else {
      xo1 = 0;
      yo1 = Math.round(0.5 * (hh - scale * ht));
      xo2 = Math.round(xo1 + scale * wd - 1);
      yo2 = yo1;
      xo3 = xo2;
      yo3 = Math.round(yo1 + scale * ht - 1);
      xo4 = xo1;
      yo4 = yo3;
    }
  } else if (input.fit === "top") {
    if (scaleflag === "y") {
      xo1 = Math.round(0.5 * (ww - scale * wd));
      yo1 = 0;
      xo2 = Math.round(xo1 + scale * wd - 1);
      yo2 = yo1;
      xo3 = xo2;
      yo3 = Math.round(yo1 + scale * ht - 1);
      xo4 = xo1;
      yo4 = yo3;
    } else {
      xo1 = 0;
      yo1 = 0;
      xo2 = Math.round(xo1 + scale * wd - 1);
      yo2 = yo1;
      xo3 = xo2;
      yo3 = Math.round(yo1 + scale + ht - 1);
      xo4 = xo1;
      yo4 = yo3;
    }
  } else if (input.fit === "crop" || input.fit === "none") {
    xo1 = 0;
    yo1 = 0;
    xo2 = ww - 1;
    yo2 = yo1;
    xo3 = xo2;
    yo3 = Math.round(scale * ht - 1);
    xo4 = xo1;
    yo4 = yo3;
  }

  let rotate = input.rotate;
  let xcent = 0;
  let ycent = 0;
  if (rotate !== 0) {
    rotate = (Math.PI / 180) * rotate;
    xcent = Math.round(0.5 * topwidth + x1);
    ycent = Math.round(0.5 * (hh / scale) + y1);
    x1 = Math.round(
      xcent + (x1 - xcent) * Math.cos(rotate) - (y1 - ycent) * Math.sin(rotate)
    );
    y1 = Math.round(
      ycent + (x1 - xcent) * Math.sin(rotate) + (y1 - ycent) * Math.cos(rotate)
    );
    x2 = Math.round(
      xcent + (x2 - xcent) + Math.cos(rotate) - (y2 - ycent) * Math.sin(rotate)
    );
    y2 = Math.round(
      ycent + (x2 - ycent) + Math.sin(rotate) + (y2 - ycent) * Math.cos(rotate)
    );
    x3 = Math.round(
      xcent + (x3 - xcent) + Math.cos(rotate) - (y3 - ycent) * Math.sin(rotate)
    );
    y3 = Math.round(
      ycent + (x3 - ycent) + Math.sin(rotate) + (y3 - ycent) * Math.cos(rotate)
    );
    x4 = Math.round(
      xcent + (x4 - xcent) + Math.cos(rotate) - (y4 - ycent) * Math.sin(rotate)
    );
    y4 = Math.round(
      ycent + (x4 - ycent) + Math.sin(rotate) + (y4 - ycent) * Math.cos(rotate)
    );
  }
  console.log(x1, y1, x2, y2, x3, y3, x4, y4);

  // Check t-shirt image has alpha
  inputFiles = [
    {
      name: tempT.name,
      content: new Uint8Array(tempT.content),
    },
    {
      name: tempTCache.name,
      content: new Uint8Array(tempTCache.content),
    },
  ];
  const res1 = await Magick.execute({
    inputFiles: inputFiles,
    commands: `identify -verbose tempT.mpc`,
  });
  let is_alpha = false;
  res1.stdout.forEach((str: string) => {
    if (str === "    Alpha:") {
      is_alpha = true;
    }
  });
  let tempA = undefined;
  let tempACache = undefined;
  if (is_alpha) {
    command = [
      "convert",
      "tempT.mpc",
      "-alpha",
      "extract",
      "-blur",
      `0x${input.antialias}`,
      "-level",
      "50x100%",
      "tempA.mpc",
    ];
    inputFiles = [
      {
        name: tempT.name,
        content: new Uint8Array(tempT.content),
      },
      {
        name: tempTCache.name,
        content: new Uint8Array(tempTCache.content),
      },
    ];
    processedFiles = await Magick.Call(inputFiles, command);
    arrayBuffer = await processedFiles[0]["blob"].arrayBuffer();
    arrayBufferCache = await processedFiles[1]["blob"].arrayBuffer();
    tempA = {
      name: "tempA.mpc",
      content: new Uint8Array(arrayBuffer),
    };
    tempACache = {
      name: "tempA.cache",
      content: new Uint8Array(arrayBufferCache),
    };
  }

  // Calculate the diff between t-shirt image and grayscale t-shirt image
  inputFiles = [
    {
      name: tempT.name,
      content: new Uint8Array(tempT.content),
    },
    {
      name: tempTCache.name,
      content: new Uint8Array(tempTCache.content),
    },
  ];
  command = [
    "convert",
    "tempT.mpc",
    "-alpha",
    "off",
    "-colorspace",
    "gray",
    "-write",
    "tempTG.mpc",
    "-crop",
    `${wd}x${ht}+${minx}+${miny}`,
    "+repage",
    "-format",
    "%[fx:100*mean-50]",
    "info:foo.txt",
  ];
  processedFiles = await Magick.Call(inputFiles, command);
  const array = Array.from(
    new Uint8Array(await processedFiles[2]["blob"].arrayBuffer())
  );
  const utf8String = new TextDecoder("utf-8").decode(Uint8Array.from(array));
  const diff = round(Number(utf8String));

  arrayBuffer = await processedFiles[0]["blob"].arrayBuffer();
  arrayBufferCache = await processedFiles[1]["blob"].arrayBuffer();
  const tempTG = {
    name: "tempTG.mpc",
    content: new Uint8Array(arrayBuffer),
  };
  const tempTGCache = {
    name: "tempTG.cache",
    content: new Uint8Array(arrayBufferCache),
  };

  let lproc = undefined;
  let cont = undefined;
  if (input.lighting === 0) {
    lproc = "";
  } else if (input.lighting > 0) {
    cont = round(input.lighting / 3);
    lproc = `-sigmoidal-contrast ${cont},50%`;
  } else if (input.lighting < 0) {
    cont = round(Math.abs(input.lighting / 3));
    lproc = `+sigmoidal-contrast ${cont},50%`;
  }
  const bproc = input.blur !== 0 ? `-blur 0x${input.blur}` : "";
  const aproc = input.attenuate !== 0 ? `-blur 0x$[input.attenuate]` : "";

  command = [
    `convert ( tempTG.mpc -evaluate subtract ${diff}% ) ( -clone 0 ${aproc} ${lproc} -write tempL.mpc ) +delete ${bproc} tempD.mpc`,
  ];
  inputFiles = [
    {
      name: tempTG.name,
      content: new Uint8Array(tempTG.content),
    },
    {
      name: tempTGCache.name,
      content: new Uint8Array(tempTGCache.content),
    },
  ];
  const res2 = await Magick.execute({
    inputFiles: inputFiles,
    commands: command,
  });
  arrayBuffer = res2.outputFiles[0].buffer;
  arrayBufferCache = res2.outputFiles[1].buffer;
  const tempL = {
    name: "tempL.mpc",
    content: new Uint8Array(arrayBuffer),
  };
  const tempLCache = {
    name: "tempL.cache",
    content: new Uint8Array(arrayBufferCache),
  };
  arrayBuffer = res2.outputFiles[2].buffer;
  arrayBufferCache = res2.outputFiles[3].buffer;
  const tempD = {
    name: "tempD.mpc",
    content: new Uint8Array(arrayBuffer),
  };
  const tempDCache = {
    name: "tempD.cache",
    content: new Uint8Array(arrayBufferCache),
  };
  const sproc = input.sharpen === 0 ? "" : `-unsharp 0x${input.sharpen} -clamp`;

  let cropping = "";
  if (input.fit === "crop" && yo3 !== undefined) {
    let hc = yo3 + 1;
    if (hh > hc) {
      cropping = `-gravity ${input.gravity} -crop ${ww}x${hc}+0+0 +repage`;
    }
  }

  const swapping = input.compose === "over" ? "+swap" : "";

  const oproc =
    input.opacity === 100
      ? ""
      : `-alpha on -channel a -evaluate multiply ${round(
          input.opacity / 100
        )} +channel`;

  command = [
    `convert -respect-parenthesis ( tempTG.mpc -alpha transparent -colorspace sRGB ) ( tempI.mpc ${cropping} -virtual-pixel none +distort perspective '${xo1},${yo1} ${x1},${y1} ${xo2},${yo2} ${x2},${y2} ${xo3},${yo3} ${x3},${y3} ${xo4},${yo4} ${x4},${y4}' ${sproc} ) -background none -layers merge +repage ( -clone 0 -alpha extract ) ( -clone 0 ${oproc} ( tempL.mpc ) ${swapping} -alpha off -compose ${input.compose} -composite ) -delete 0 +swap -compose over -alpha off -compose copy_opacity -composite tempD.mpc -define compose:args=-${input.displace},-${input.displace} -compose displace -composite tempITD.mpc`,
  ];
  inputFiles = [
    {
      name: tempTG.name,
      content: new Uint8Array(tempTG.content),
    },
    {
      name: tempTGCache.name,
      content: new Uint8Array(tempTGCache.content),
    },
    {
      name: tempI.name,
      content: new Uint8Array(tempI.content),
    },
    {
      name: tempICache.name,
      content: new Uint8Array(tempICache.content),
    },
    {
      name: tempL.name,
      content: new Uint8Array(tempL.content),
    },
    {
      name: tempLCache.name,
      content: new Uint8Array(tempLCache.content),
    },
    {
      name: tempD.name,
      content: new Uint8Array(tempD.content),
    },
    {
      name: tempDCache.name,
      content: new Uint8Array(tempDCache.content),
    },
  ];
  const res3 = await Magick.execute({
    inputFiles: inputFiles,
    commands: command,
  });
  arrayBuffer = res3.outputFiles[0].buffer;
  arrayBufferCache = res3.outputFiles[1].buffer;
  const tempITD = {
    name: "tempITD.mpc",
    content: new Uint8Array(arrayBuffer),
  };
  const tempITDCache = {
    name: "tempITD.cache",
    content: new Uint8Array(arrayBufferCache),
  };

  const mask = tempM !== undefined ? "tempM.mpc" : "";

  if (is_alpha && tempA !== undefined && tempACache !== undefined) {
    command = [
      `convert tempT.mpc tempITD.mpc ${mask} -compose over -composite tempA.mpc -alpha off -compose copy_opacity -composite out.png`,
    ];
    command = [
      "convert",
      "tempT.mpc",
      "tempITD.mpc",
      `${mask}`,
      "-compose",
      "over",
      "-composite",
      "tempA.mpc",
      "-alpha",
      "off",
      "-compose",
      "copy_opacity",
      "-composite",
      "out.png",
    ];
    inputFiles = [
      {
        name: tempT.name,
        content: new Uint8Array(tempT.content),
      },
      {
        name: tempTCache.name,
        content: new Uint8Array(tempTCache.content),
      },
      {
        name: tempITD.name,
        content: new Uint8Array(tempITD.content),
      },
      {
        name: tempITDCache.name,
        content: new Uint8Array(tempITDCache.content),
      },
      {
        name: tempA.name,
        content: new Uint8Array(tempA.content),
      },
      {
        name: tempACache.name,
        content: new Uint8Array(tempACache.content),
      },
    ];
    if (tempM !== undefined) {
      inputFiles.push({
        name: tempM.name,
        content: new Uint8Array(tempM.content),
      });
    }
    if (tempMCache !== undefined) {
      inputFiles.push({
        name: tempMCache.name,
        content: new Uint8Array(tempMCache.content),
      });
    }
  } else {
    command = [
      "convert",
      "tempT.mpc",
      "tempITD.mpc",
      `${mask}`,
      "-compose",
      "over",
      "-composite",
      "out.png",
    ];
    inputFiles = [
      {
        name: tempT.name,
        content: new Uint8Array(tempT.content),
      },
      {
        name: tempTCache.name,
        content: new Uint8Array(tempTCache.content),
      },
      {
        name: tempITD.name,
        content: new Uint8Array(tempITD.content),
      },
      {
        name: tempITDCache.name,
        content: new Uint8Array(tempITDCache.content),
      },
    ];
    if (tempM !== undefined) {
      inputFiles.push({
        name: tempM.name,
        content: new Uint8Array(tempM.content),
      });
    }
    if (tempMCache !== undefined) {
      inputFiles.push({
        name: tempMCache.name,
        content: new Uint8Array(tempMCache.content),
      });
    }
  }

  const res4 = await Magick.Call(inputFiles, command);
  return res4[0]["blob"];
}

function round(num: number) {
  return Math.round(num * 100000) / 100000;
}
