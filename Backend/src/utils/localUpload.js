import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const getExtensionFromBuffer = (buffer) => {
  const signature = buffer.subarray(0, 4).toString("hex");

  if (signature.startsWith("89504e47")) return "png";
  if (signature.startsWith("ffd8")) return "jpg";
  if (signature.startsWith("47494638")) return "gif";
  if (signature.startsWith("25504446")) return "pdf";

  return "bin";
};

export const uploadLocal = async (buffer, folder = "misc") => {
  if (!buffer) return null;

  const safeFolder = folder.replace(/\\/g, "/").replace(/[^a-zA-Z0-9/_-]/g, "");
  const uploadDir = path.join(process.cwd(), "public", "uploads", safeFolder);
  await fs.mkdir(uploadDir, { recursive: true });

  const extension = getExtensionFromBuffer(buffer);
  const filename = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const filepath = path.join(uploadDir, filename);
  await fs.writeFile(filepath, buffer);

  const port = process.env.PORT || 8000;
  const baseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${port}`;
  const publicPath = `/uploads/${safeFolder}/${filename}`.replace(/\/+/g, "/");

  return {
    secure_url: `${baseUrl}${publicPath}`,
    url: `${baseUrl}${publicPath}`,
    public_id: publicPath,
  };
};
