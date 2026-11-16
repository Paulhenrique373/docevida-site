const path = require("path");
module.exports = {
  webpack: { alias: { "@": path.resolve(__dirname, "src") } },
  jest: {
    configure: {
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
        // Jest 27 (CRA 5) não lê o campo "exports" do react-router 7; mapeia os subcaminhos usados em testes.
        "^react-router/dom$": "<rootDir>/node_modules/react-router/dist/development/dom-export.js",
        "^react-router$": "<rootDir>/node_modules/react-router/dist/development/index.js",
      },
    },
  },
};
