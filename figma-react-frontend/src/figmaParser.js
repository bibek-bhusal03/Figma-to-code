const fs = require("fs");
const figmaData = JSON.parse(fs.readFileSync("./figmaFile.json", "utf8"));
const extractedData = JSON.parse(
  fs.readFileSync("./figmaExtracted.json", "utf8")
);

// this function maps Figma nodes to JSX strings
function mapFigmaToJSX(node, indent = "  ") {
  if (!node) return "";

  const style = {
    position: "absolute",
    left: `${node.absoluteBoundingBox?.x || 0}px`,
    top: `${node.absoluteBoundingBox?.y || 0}px`,
    width: `${node.absoluteBoundingBox?.width || 0}px`,
    height: `${node.absoluteBoundingBox?.y || 0}px`,
    backgroundColor: getBackgroundColor(node),
  };

  const styleString = JSON.stringify(style, null, 2)
    .replace(/"([^"]+)":/g, "$1:")
    .replace(/\n/g, `\n${indent}`);
  function getBackgroundColor(node) {
    const colorEntry = extractedData.colors.find((c) => c.id === node.id);
    if (colorEntry) {
      return `rgb(${colorEntry.color.r}, ${colorEntry.color.g}, ${colorEntry.color.b})`;
    }
    return "transparent";
  }

  let jsx = "";
  switch (node.type) {
    case "FRAME":
    case "GROUP":
      jsx += `${indent}<div style={${styleString}}>\n`;
      node.children?.forEach((child) => {
        jsx += mapFigmaToJSX(child, indent + "  ");
      });
      jsx += `${indent}</div>\n`;
      break;
    case "RECTANGLE":
      jsx += `${indent}<div style={${styleString}} />\n`;
      break;
    case "TEXT":
      const textEntry = extractedData.texts.find((t) => t.id === node.id);
      jsx += `${indent}<p style={${styleString}}>${
        textEntry?.content || node.characters || ""
      }</p>\n`;
      break;
    default:
      return "";
  }
  return jsx;
}

// Generate the React component
const componentCode =
  `import React from 'react';\n\n` +
  `const FigmaComponent = () => (\n` +
  `  <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>\n` +
  mapFigmaToJSX(figmaData.document, "    ") +
  `  </div>\n` +
  `);\n\n` +
  `export default FigmaComponent;\n`;

fs.writeFileSync("./FigmaComponent.jsx", componentCode, "utf8");
console.log(" Generated React component at src/FigmaComponent.jsx");
