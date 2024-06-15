// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");

module.exports = {
  extends: [path.resolve(__dirname, "../../eslint-preset")],
  parserOptions: {
    project: path.resolve(__dirname, "./tsconfig.json"),
  },
};
