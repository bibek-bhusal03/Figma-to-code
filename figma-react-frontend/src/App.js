import React from "react";
import data from "./data.json"; // save your JSON as data.json

const App = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">JSON Renderer</h1>

      {/* Texts Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Texts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.texts.map((item) => (
            <div
              key={item.id}
              className="bg-white shadow rounded-xl p-4 border border-gray-200"
            >
              <h3 className="text-lg font-bold">{item.name}</h3>
              <p className="text-gray-700">{item.content}</p>
              <p className="text-sm text-gray-400 mt-2">ID: {item.id}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Colors Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Colors</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {data.colors.map((colorItem) => {
            const { r, g, b } = colorItem.color;
            const rgb = `rgb(${r}, ${g}, ${b})`;
            return (
              <div
                key={colorItem.id}
                className="flex flex-col items-center justify-center p-4 rounded-xl shadow border"
                style={{ backgroundColor: rgb }}
              >
                <p
                  className="text-sm font-bold"
                  style={{ color: r + g + b < 400 ? "white" : "black" }}
                >
                  {colorItem.name}
                </p>
                <p
                  className="text-xs"
                  style={{ color: r + g + b < 400 ? "white" : "black" }}
                >
                  {rgb}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default App;
