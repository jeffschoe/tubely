import { getBearerToken, validateJWT } from "../auth";
import { respondWithJSON } from "./json";
import { getVideo, updateVideo } from "../db/videos";
import type { ApiConfig } from "../config";
import type { BunRequest } from "bun";
import { BadRequestError, NotFoundError, UserForbiddenError } from "./errors";


export async function handlerUploadThumbnail(cfg: ApiConfig, req: BunRequest) {
  const { videoId } = req.params as { videoId?: string };
  if (!videoId) {
    throw new BadRequestError("Invalid video ID");
  }

  const token = getBearerToken(req.headers);
  const userID = validateJWT(token, cfg.jwtSecret);

  console.log("uploading thumbnail for video", videoId, "by user", userID);

  // TODO: implement the upload here
  const formData = await req.formData();

  const file = formData.get("thumbnail");
  if (!(file instanceof File)) {
    throw new BadRequestError('Thumbnail file missing')
  }

  const MAX_UPLOAD_SIZE = 10 << 20; // 10MB, bitshifted

  if (file.size > MAX_UPLOAD_SIZE) {
    throw new BadRequestError(
      `Thumbnail file exceeds the maximum allowed size of 10MB`
    );
  }

  const mediaType = file.type;
  if (!mediaType) {
    throw new BadRequestError("Missing Content-Type for thumbnail");
  }

  const fileData = await file.arrayBuffer();
  if (!fileData) {
    throw new Error("Error reading file data");
  }

  let video = getVideo(cfg.db, videoId);
  if(!video) {
    throw new NotFoundError("Video not found");
  }

  if (video.userID !== userID) {
    throw new UserForbiddenError(
      `User: ${userID} is not authorized to update this video`
    );
  }

  const base64Encoded = Buffer.from(fileData).toString("base64");
  const base64DataURL = `data:${mediaType};base64,${base64Encoded}`;

  video.thumbnailURL = base64DataURL;

  updateVideo(cfg.db, video);

  return respondWithJSON(200, video);
}
