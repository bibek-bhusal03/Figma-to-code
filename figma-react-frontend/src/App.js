import { mapFigmaToReact } from "./figmaParser"; // If generating dynamically

// Or hardcode generated JSX if you output it statically
function App() {
  const figmaData = ""; // Load JSON here if dynamic, but for prod, pre-generate
  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      {mapFigmaToReact(figmaData.document)}
    </div>
  );
}

export default App;
