import { NextRequest, NextResponse } from "next/server";

// ESPN public API - no auth needed
const ESPN_SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date"); // YYYYMMDD format
  const url = date ? `${ESPN_SCOREBOARD}?dates=${date}` : ESPN_SCOREBOARD;

  try {
    const res = await fetch(url, { next: { revalidate: 30 } }); // cache 30s
    const data = await res.json();

    const games = (data.events || []).map((e: any) => {
      const comp = e.competitions?.[0];
      const home = comp?.competitors?.find((c: any) => c.homeAway === "home");
      const away = comp?.competitors?.find((c: any) => c.homeAway === "away");
      return {
        id: e.id,
        name: e.shortName,
        status: comp?.status?.type?.description,
        detail: comp?.status?.type?.shortDetail,
        clock: comp?.status?.displayClock,
        period: comp?.status?.period,
        state: comp?.status?.type?.state, // pre, in, post
        home: { name: home?.team?.shortDisplayName, score: home?.score, logo: home?.team?.logo, seed: home?.curatedRank?.current },
        away: { name: away?.team?.shortDisplayName, score: away?.score, logo: away?.team?.logo, seed: away?.curatedRank?.current },
        broadcast: comp?.broadcast,
      };
    });

    return NextResponse.json({ games });
  } catch {
    return NextResponse.json({ games: [] });
  }
}
