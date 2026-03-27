import { NextResponse } from "next/server"
import { UTApi } from "uploadthing/server"
import { getCurrentSession } from "@/lib/auth/session"

export const runtime = "nodejs"

type UploadVideoBody = {
  videoUrl?: string
}

const utapi = new UTApi()

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await request.json()) as UploadVideoBody

    if (!body.videoUrl || typeof body.videoUrl !== "string") {
      return NextResponse.json({ error: "videoUrl is required" }, { status: 400 })
    }

    const uploadResult = await utapi.uploadFilesFromUrl(body.videoUrl)

    if (uploadResult.error || !uploadResult.data) {
      const message = uploadResult.error?.message || "UploadThing upload failed"
      return NextResponse.json({ error: message }, { status: 502 })
    }

    return NextResponse.json({
      url: uploadResult.data.ufsUrl || uploadResult.data.url,
      key: uploadResult.data.key,
    })
  } catch {
    return NextResponse.json({ error: "Unable to upload generated video" }, { status: 500 })
  }
}
