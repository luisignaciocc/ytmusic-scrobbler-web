export type YTAPIResponse = {
  musicShelfRenderer?: {
    title?: {
      runs?: [{ text?: "Today" | "Yesterday" | "This week" | string }];
    };
    contents?: {
      musicResponsiveListItemRenderer?: {
        flexColumns?: {
          musicResponsiveListItemFlexColumnRenderer?: {
            text?: {
              runs?: [
                {
                  text?: string;
                  navigationEndpoint?: {
                    watchEndpoint?: {
                      videoId?: string;
                      watchEndpointMusicSupportedConfigs?: {
                        watchEndpointMusicConfig?: {
                          musicVideoType?: "MUSIC_VIDEO_TYPE_ATV";
                        };
                      };
                    };
                    browseEndpoint?: {
                      browseEndpointContextSupportedConfigs?: {
                        browseEndpointContextMusicConfig?: {
                          pageType?:
                            | "MUSIC_PAGE_TYPE_ARTIST"
                            | "MUSIC_PAGE_TYPE_ALBUM";
                        };
                      };
                    };
                  };
                },
              ];
            };
          };
        }[];
      };
    }[];
  };
}[];

export type LastFmScrobbleResponse = {
  lfm: {
    $: {
      status: "ok" | "failed";
    };
    scrobbles?: [
      {
        $: {
          ignored: "0" | "1";
          accepted: "1" | "0";
        };
        scrobble: [
          {
            track: [
              {
                _: string;
                $: {
                  corrected: "0";
                };
              },
            ];
            artist: [
              {
                _: string;
                $: {
                  corrected: "0";
                };
              },
            ];
            album: [
              {
                _: string;
                $: {
                  corrected: "0";
                };
              },
            ];
            albumArtist: [
              {
                $: {
                  corrected: "0";
                };
              },
            ];
            timestamp: [string];
            ignoredMessage: [
              {
                $: {
                  code: "0";
                };
              },
            ];
          },
        ];
      },
    ];
  };
};
