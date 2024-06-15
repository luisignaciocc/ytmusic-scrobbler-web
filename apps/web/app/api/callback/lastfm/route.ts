// https://www.last.fm/api/accounts
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { redirect } from "next/navigation";
import { parseStringPromise } from "xml2js";

import getServerSession from "@/helpers/get-server-session";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  const session = await getServerSession();
  const { LAST_FM_API_KEY, LAST_FM_API_SECRET } = process.env;

  if (
    !session?.user?.email ||
    !LAST_FM_API_KEY ||
    !LAST_FM_API_SECRET ||
    !token
  ) {
    console.error("Session or env vars not set up correctly");
    return redirect("/");
  }

  const uri = new URL("https://ws.audioscrobbler.com/2.0/");

  try {
    const url = new URL(uri);

    url.searchParams.set("api_key", LAST_FM_API_KEY);
    url.searchParams.set("method", "auth.getSession");
    url.searchParams.set("token", token);

    const signature = crypto
      .createHash("md5")
      .update(
        `api_key${LAST_FM_API_KEY}methodauth.getSessiontoken${token}${LAST_FM_API_SECRET}`,
        "utf-8"
      )
      .digest("hex");

    url.searchParams.set("api_sig", signature);

    const res = await fetch(url.toString(), {
      method: "POST",
    });

    const text = await res.text();

    const { lfm }: LastFmCallbackSessionResponse = await parseStringPromise(
      text
    );

    if (!lfm || lfm.$.status === "failed" || !lfm.session?.[0]?.key?.[0]) {
      console.error("Last.fm session failed", lfm.error?.[0]._);
      return redirect("/");
    }

    const lastFmSessionKey = lfm.session[0].key[0];
    const lastFmUsername = lfm.session[0].name[0];

    await prisma.user.update({
      where: {
        email: session.user.email,
      },
      data: {
        lastFmSessionKey,
        lastFmUsername,
      },
    });

    return redirect("/");
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        "An error occurred while processing the lastfm callback",
        error.message
      );
      return redirect("/");
    } else {
      console.error("An error occurred while processing the lastfm callback");
      return redirect("/");
    }
  }
}

type LastFmCallbackSessionResponse = {
  lfm: {
    $: {
      status: "ok" | "failed";
    };
    session?: [
      {
        name: [string];
        key?: [string];
        subscriber: [string];
      }
    ];
    error?: [
      {
        _: string;
        $: {
          code: string;
        };
      }
    ];
  };
};
