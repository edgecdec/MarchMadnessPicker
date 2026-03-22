import { NextRequest, NextResponse } from "next/server";

const ESPN_SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  // groups=100 = NCAA Tournament only
  const url = date ? `${ESPN_SCOREBOARD}?dates=${date}&groups=100` : `${ESPN_SCOREBOARD}?groups=100`;

  try {
    const res = await fetch(url, { next: { revalidate: 30 } });
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
        state: comp?.status?.type?.state,
        home: { name: home?.team?.shortDisplayName, score: home?.score, logo: home?.team?.logo, id: home?.team?.id },
        away: { name: away?.team?.shortDisplayName, score: away?.score, logo: away?.team?.logo, id: away?.team?.id },
        broadcast: comp?.broadcast,
      };
    });

    return NextResponse.json({ games });
  } catch {
    return NextResponse.json({ games: [] });
  }
}
