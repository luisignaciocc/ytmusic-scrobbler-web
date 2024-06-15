import { resolve } from "path";

module.exports = {
  extends: [resolve(__dirname, "../../eslint-preset")],
  parserOptions: {
    project: resolve(__dirname, "./tsconfig.json"),
  },
};
