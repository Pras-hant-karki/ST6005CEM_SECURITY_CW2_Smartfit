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
  const isProfilePicture = safeFolder.includes("profile-picture");
  // this decides which files are safe to keep public vs which are sensitive
  const rootDir = isProfilePicture ? "public" : "private";
  // sensitive files now go into "private" folder instead of always "public"
  const uploadDir = path.join(process.cwd(), rootDir, "uploads", safeFolder);
  await fs.mkdir(uploadDir, { recursive: true });

  const extension = getExtensionFromBuffer(buffer);
  const filename = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const filepath = path.join(uploadDir, filename);
  await fs.writeFile(filepath, buffer);

  const port = process.env.PORT || 8000;
  const baseUrl = process.env.PUBLIC_BASE_URL || `http://192.168.1.67:${port}`;

  if (isProfilePicture) {
    // only profile pictures still get a plain public link as usual, since they are not sensitive
    const publicPath = `/uploads/${safeFolder}/${filename}`.replace(/\/+/g, "/");
    return {
      secure_url: `${baseUrl}${publicPath}`,
      url: `${baseUrl}${publicPath}`,
      public_id: publicPath,
    };
  }

  // sensitive docs now get a link that points at the admin-only route,
  // not a direct static-file link anyone can open
  const privatePath = `/api/v1/admin/documents/${safeFolder}/${filename}`.replace(/\/+/g, "/");
  return {
    secure_url: `${baseUrl}${privatePath}`,
    url: `${baseUrl}${privatePath}`,
    public_id: `${safeFolder}/${filename}`,
  };
};


