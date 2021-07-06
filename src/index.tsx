import React from "react";
import ReactDOM from "react-dom";
import { App } from "./App";


function main(): void {
  const root = document.getElementById("root");
  if (root) {
    ReactDOM.render(<App />, root);
  } else {
    console.error("Unable to mount react component as root element not found");
  }
}
main();
