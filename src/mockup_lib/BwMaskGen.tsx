export async function BwMaskGen(name: string, content: Uint8Array) {
  const Magick = (window as any).magick;

  let inputFiles = [
    {
      name: name,
      content: new Uint8Array(content),
    },
  ];

  let command = [`convert ${name} -colorspace Gray -threshold 50% temp.png`];

  let processedFiles = await Magick.execute({
    inputFiles: inputFiles,
    commands: command,
  });
  console.log(processedFiles);
  let arrayBuffer = processedFiles.outputFiles[0].buffer;
  const tempI = {
    name: "temp.png",
    content: new Uint8Array(arrayBuffer),
  };

  inputFiles = [
    {
      name: name,
      content: new Uint8Array(content),
    },
    {
      name: "temp.png",
      content: new Uint8Array(tempI.content),
    },
  ];

  // command = [`composite ${name} temp.png -compose CopyOpacity bw_mask.png`];
  command = [
    "composite",
    `${name}`,
    "temp.png",
    "-compose",
    "CopyOpacity",
    "bw_mask.png",
  ];
  const res = await Magick.Call(inputFiles, command);
  return res[0]["blob"];
}
