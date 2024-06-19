// you should have an instagram business account and link it to a facebook page

// the, create an app for the facebook page on https://developers.facebook.com/apps, in type of app select "Business" and link your page
// with the app created, select "API Graph for Instagram", that will activate the api graph

// once you do that, you can get the short lived token on https://developers.facebook.com/tools/explorer/

// on the explorer select your app, and select the permissions you need, then click on "Generate Access Token"

// permissions
// pages_show_list
// ads_management
// business_management
// instagram_basic
// instagram_manage_comments
// instagram_manage_insights
// instagram_content_publish
// pages_read_engagement
// pages_manage_posts

// get short lived token on https://developers.facebook.com/tools/explorer/
import { NextResponse } from "next/server";

// to get ig account id first -> /me/accounts -> get fb account id -> /{fb_account_id}?fields=instagram_business_account -> get ig account id

// en app -> settings -> basic -. get app id and app secret

// http://localhost:3000/api/instagram/get-token
export async function GET(): Promise<NextResponse> {
  const isLocalHost =
    process.env.VERCEL_ENV !== "production" &&
    process.env.VERCEL_ENV !== "preview";

  if (!isLocalHost) {
    return NextResponse.json(
      {
        ok: false,
        message: "This endpoint is only available on localhost.",
      },
      { status: 401 },
    );
  }

  const shortLivedToken = process.env.FACEBOOK_SHORT_LIVE_TOKEN;

  if (!shortLivedToken) {
    return NextResponse.json({
      ok: false,
      message: "No se encontró un token de acceso válido.",
    });
  }

  const apiVersion = process.env.FACEBOOK_API_VERSION;
  const clientId = process.env.FACEBOOK_APP_ID;
  const clientSecret = process.env.FACEBOOK_APP_SECRET;

  if (!apiVersion || !clientId || !clientSecret) {
    return NextResponse.json({
      ok: false,
      message: "No se encontró un token de acceso válido.",
    });
  }

  const res = await fetch(
    `https://graph.facebook.com/${apiVersion}/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${shortLivedToken}`,
  );

  const data: {
    access_token: string;
    token_type: string;
  } = await res.json();

  return NextResponse.json({ data });
}
