import crypto from "crypto";

export default function hashRequest(
  params: Record<string, string>,
  secretKey: string,
) {
  let string = "";
  const keys = Object.keys(params).sort();
  keys.forEach((key) => {
    string += key;
    string += params[key];
  });
  string += secretKey;
  return crypto.createHash("md5").update(string, "utf8").digest("hex");
}
