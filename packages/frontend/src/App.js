import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/hello")
      .then((response) => response.json())
      .then((data) => setMessage(data.message))
      .catch((error) => console.error("Error cargando mensaje.", error));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Monorepo Demo</h1>
        <p>{message ? message : "Cargando mensaje del backend..."}</p>
      </header>
    </div>
  );
}

export default App;
