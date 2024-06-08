import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } =
    process.env;

  if (
    !GOOGLE_CLIENT_ID ||
    !GOOGLE_CLIENT_SECRET ||
    !GOOGLE_REDIRECT_URI ||
    !code
  ) {
    return NextResponse.json(
      { error: "Env vars not set up correctly" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: GOOGLE_REDIRECT_URI,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch token" },
        { status: 500 }
      );
    }

    const data: {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scope: string;
      token_type: "Bearer";
      id_token?: string;
    } = await response.json();

    const expires_at = new Date().getTime() + data.expires_in * 1000;

    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v1/userinfo?alt=json",
      {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      }
    );

    if (!userInfoResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch user info" },
        { status: 500 }
      );
    }
    const userInfo: {
      id: string;
      name: string;
      given_name: string;
      family_name: string;
      picture: string;
    } = await userInfoResponse.json();

    const user = await prisma.user.findFirst({
      where: {
        googleId: userInfo.id,
      },
    });

    if (!user) {
      await prisma.user.create({
        data: {
          googleId: userInfo.id,
          name: userInfo.name,
          picture: userInfo.picture,
          googleAccessToken: data.access_token,
          googleRefreshToken: data.refresh_token,
          googleTokenExpires: expires_at,
        },
      });
    } else {
      await prisma.user.update({
        where: {
          googleId: userInfo.id,
        },
        data: {
          name: userInfo.name,
          picture: userInfo.picture,
          googleAccessToken: data.access_token,
          googleTokenExpires: expires_at,
          googleRefreshToken: data.refresh_token,
        },
      });
    }

    return NextResponse.json(
      { name: userInfo.name, picture: userInfo.picture, ...data },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json(
        { error: "An unknown error occurred" },
        { status: 500 }
      );
    }
  }
}
