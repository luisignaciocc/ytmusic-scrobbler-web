import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function GET() {
  // const apiKey = request.headers.get("x-api-key");

  // if (apiKey !== process.env.API_KEY) {
  //   return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  // }

  try {
    const access_token = process.env.FACEBOOK_LONG_LIVE_TOKEN;
    const igUserId = process.env.IG_PAGE_ID;
    const apiVersion = process.env.FACEBOOK_API_VERSION;
    const lastfmApiToken = process.env.LAST_FM_API_KEY;

    if (!access_token || !igUserId || !apiVersion) {
      return NextResponse.json({
        ok: false,
        message: "No se encontró un token de acceso válido.",
      });
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const ninetiesYear = 1990 + (currentYear % 10);

    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    const date = `${ninetiesYear}-${month}-${day}`;

    const musicbrainzResponse = await fetch(
      `https://musicbrainz.org/ws/2/release/?query=date:${date}&fmt=json`,
      {
        headers: {
          "User-Agent": "That90sAlbums/1.0 ( luisignacioccp@gmail.com )",
        },
      },
    );

    const { releases }: MusicbrainzResponse = await musicbrainzResponse.json();

    const albums = [];
    for (const release of releases) {
      const lastfmResponse: Response = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=${lastfmApiToken}&mbid=${release.id}&format=json`,
      );

      if (!lastfmResponse.ok) {
        continue;
      }

      const { album }: LastfmResponse = await lastfmResponse.json();

      albums.push({
        title: album.name,
        artist: album.artist,
        coverImage: album.image.find((img) => img.size === "extralarge")![
          "#text"
        ],
        playCount: album.playcount,
      });
    }

    const sortedAlbums = albums
      .sort((a, b) => +b.playCount - +a.playCount)
      .slice(0, 10);
    if (sortedAlbums.length === 0) {
      return NextResponse.json(
        { error: "No se encontró ningún álbum" },
        { status: 404 },
      );
    }

    const creationIds = [];
    for (const album of sortedAlbums) {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${igUserId}/media`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            image_url: album.coverImage,
            caption: "#firtsPost",
            access_token,
            is_carousel_item: "true",
          }),
        },
      );
      if (res.ok) {
        const {
          id: creation_id,
        }: {
          id: string;
        } = await res.json();
        creationIds.push(creation_id);
      }
    }

    const carouselResponse = await fetch(
      `https://graph.facebook.com/${apiVersion}/${igUserId}/media`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          caption: "#firtsPost",
          access_token,
          media_type: "CAROUSEL",
          children: creationIds.join(","),
        }),
      },
    );

    if (!carouselResponse.ok) {
      const error = await carouselResponse.json();
      console.error(error);
      return NextResponse.json(
        { error: "Error al crear el carrusel" },
        { status: 500 },
      );
    }

    const {
      id: creation_id,
    }: {
      id: string;
    } = await carouselResponse.json();

    const res2 = await fetch(
      `https://graph.facebook.com/${apiVersion}/${igUserId}/media_publish`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          creation_id,
          access_token,
        }),
      },
    );

    const {
      id: media_id,
    }: {
      id: string;
    } = await res2.json();

    return NextResponse.json(
      { success: true, url: `https://www.instagram.com/p/${media_id}` },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Error al hacer la solicitud a la API: ${error.message}` },
        { status: 500 },
      );
    } else {
      return NextResponse.json(
        {
          error: "Error al hacer la solicitud a la API",
        },
        { status: 500 },
      );
    }
  }
}

type MusicbrainzResponse = {
  created: string;
  count: number;
  offset: number;
  releases: MusicbrainzRelease[];
};

type MusicbrainzRelease = {
  id: string;
  score: number;
  "status-id": string;
  "packaging-id": string;
  count: number;
  title: "Spirit";
  status: "Official";
  packaging: "Jewel Case";
  "text-representation": {
    language: string;
    script: string;
  };
  "artist-credit": {
    name: string;
    artist: {
      id: string;
      name: string;
      "sort-name": string;
      disambiguation: string;
    };
  }[];
  "release-group": {
    id: string;
    "type-id": string;
    "primary-type-id": string;
    title: string;
    "primary-type": string;
  };
  date: string;
  country: string;
  "release-events": {
    date: string;
    area: {
      id: string;
      name: string;
      "sort-name": string;
      "iso-3166-1-codes": string[];
    };
  }[];
  barcode: string;
  "label-info": {
    "catalog-number": string;
    label: {
      id: string;
      name: string;
    };
  }[];
  "track-count": number;
  media: {
    format: string;
    "disc-count": number;
    "track-count": number;
  }[];
};

type LastfmResponse = {
  album: {
    artist: string;
    tags: {
      tag: {
        url: string;
        name: string;
      }[];
    };
    name: string;
    image: {
      size: "small" | "medium" | "large" | "extralarge" | "mega" | "";
      "#text": string;
    }[];
    tracks: {
      track: {
        streamable: {
          fulltrack: "0";
          "#text": "0";
        };
        duration: number;
        url: string;
        name: string;
        "@attr": {
          rank: number;
        };
        artist: {
          url: string;
          name: string;
          mbid: string;
        };
      }[];
    };
    listeners: string;
    playcount: string;
    url: string;
    wiki: {
      published: string;
      summary: string;
      content: string;
    };
  };
};
