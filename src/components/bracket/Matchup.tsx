"use client";
import { Box, Typography, Paper, Tooltip } from "@mui/material";
import { Team, GameScore } from "@/types";
import { getTeamLogoUrl, getTeamAbbreviation, SEED_WIN_RATES } from "@/lib/bracketData";

function getSeedMatchupTip(teamA?: Team, teamB?: Team): string | null {
  if (!teamA || !teamB) return null;
  const hi = Math.min(teamA.seed, teamB.seed);
  const lo = Math.max(teamA.seed, teamB.seed);
  if (hi === lo) return null;
  const pct = SEED_WIN_RATES[`${hi}-${lo}`];
  if (!pct) return null;
  return `${hi}-seeds beat ${lo}-seeds ${pct}% of the time`;
}

interface Props {
  teamA?: Team;
  teamB?: Team;
  winner?: string;
  result?: string;
  gameScore?: GameScore;
  onPick: (team: Team) => void;
  locked?: boolean;
  compact?: boolean;
  distribution?: Record<string, number>;
  regionColor?: string;
  eliminated?: Set<string>;
}

function TeamSlot({
  team,
  isWinner,
  isCorrect,
  isWrong,
  isActualWinner,
  isEliminated,
  score,
  isLive,
  onClick,
  onPickTeam,
  locked,
  position,
  pct,
  regionColor,
}: {
  team?: Team;
  isWinner: boolean;
  isCorrect?: boolean;
  isWrong?: boolean;
  isActualWinner?: boolean;
  isEliminated?: boolean;
  score?: string;
  isLive?: boolean;
  onClick: () => void;
  onPickTeam?: (team: Team) => void;
  locked?: boolean;
  position: "top" | "bottom";
  pct?: number;
  regionColor?: string;
}) {
  const isFirstFourPlaceholder = team && team.name.includes("/");
  const bg = isCorrect
    ? "rgba(76, 175, 80, 0.3)"
    : isWrong
    ? "rgba(244, 67, 54, 0.3)"
    : isWinner
    ? "rgba(255, 111, 0, 0.25)"
    : "transparent";

  return (
    <Box
      onClick={() => !locked && team && onClick()}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        px: 0.75,
        py: { xs: 0.75, sm: 0.25 },
        cursor: locked || !team ? "default" : "pointer",
        background: bg,
        border: 1,
        borderColor: regionColor || "divider",
        borderTopWidth: position === "top" ? 1 : 0,
        width: 155,
        minHeight: { xs: 32, sm: "auto" },
        opacity: isEliminated ? 0.35 : 1,
        "&:hover": !locked && team ? { background: isWinner ? bg : "action.hover" } : {},
        transition: "background 0.2s ease, opacity 0.2s ease, transform 0.2s ease",
        transform: isWinner ? "scale(1.02)" : "scale(1)",
      }}
    >
      {team ? (
        <Box
          sx={{
            display: "contents",
            "@keyframes pickFadeIn": {
              from: { opacity: 0, transform: "translateX(-6px)" },
              to: { opacity: 1, transform: "translateX(0)" },
            },
            animation: "pickFadeIn 0.25s ease-out",
          }}
        >
          <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 700, minWidth: 16, fontSize: "0.65rem" }}>
            {team.seed}
          </Typography>
          {isFirstFourPlaceholder ? (
            <Box sx={{ display: "flex", gap: 0.25, flexGrow: 1, overflow: "hidden" }}>
              {team.name.split("/").map((name, idx, arr) => {
                const logo = getTeamLogoUrl(name);
                const abbr = getTeamAbbreviation(name);
                return (
                  <Box
                    key={name}
                    sx={{ display: "flex", alignItems: "center", gap: 0.25, overflow: "hidden" }}
                  >
                    {logo && <Box component="img" src={logo} alt="" sx={{ width: 14, height: 14, objectFit: "contain", flexShrink: 0 }} />}
                    <Typography variant="body2" noWrap sx={{ fontSize: "0.65rem" }}>{abbr}{idx < arr.length - 1 ? "/" : ""}</Typography>
                  </Box>
                );
              })}
            </Box>
          ) : (
            <>
              {(() => { const logo = getTeamLogoUrl(team.name); return logo ? (
                <Box component="img" src={logo} alt="" sx={{ width: 16, height: 16, objectFit: "contain", flexShrink: 0 }} />
              ) : null; })()}
              <Typography variant="body2" noWrap sx={{ fontSize: "0.7rem", fontWeight: isWinner || isActualWinner ? 700 : 400, flexGrow: 1 }}>
                {team.name}
              </Typography>
            </>
          )}
          {isCorrect && <Typography component="span" sx={{ fontSize: "0.6rem", color: "success.main" }}>✓</Typography>}
          {isWrong && <Typography component="span" sx={{ fontSize: "0.6rem", color: "error.main" }}>✗</Typography>}
          {isActualWinner && !isCorrect && <Typography component="span" sx={{ fontSize: "0.6rem" }}>🏆</Typography>}
          {score && (
            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.65rem", color: isLive ? "success.main" : "text.secondary", ml: 0.5 }}>
              {score}
            </Typography>
          )}
          {pct !== undefined && (
            <Tooltip title={`${pct}% of players picked ${team.name}`} arrow>
              <Typography variant="caption" sx={{ fontSize: "0.55rem", color: "text.disabled", ml: 0.5 }}>
                {pct}%
              </Typography>
            </Tooltip>
          )}
        </Box>
      ) : (
        <Typography variant="body2" sx={{ color: "text.disabled", fontSize: "0.7rem", fontStyle: "italic" }}>—</Typography>
      )}
    </Box>
  );
}

export default function Matchup({ teamA, teamB, winner, result, gameScore, onPick, locked, compact, distribution, regionColor, eliminated }: Props) {
  const isLive = gameScore?.state === "in";
  const seedTip = getSeedMatchupTip(teamA, teamB);

  // Match pick/result values against team's regionSeed (preferred) or name (fallback)
  const teamMatch = (team: Team | undefined, value?: string) => {
    if (!team || !value) return false;
    if (team.regionSeed && team.regionSeed === value) return true;
    // Fallback for legacy name-based values and FF play-in picks
    if (team.name === value) return true;
    if (value.includes("/")) return value.split("/").includes(team.name);
    if (team.name.includes("/")) return team.name.split("/").includes(value);
    return false;
  };

  const content = (
    <Paper elevation={0} sx={{ background: "transparent", borderRadius: 0, my: compact ? 0 : 0.25 }}>
      {gameScore?.detail && (
        <Typography variant="caption" sx={{ fontSize: "0.55rem", color: isLive ? "success.main" : "text.secondary", display: "block", textAlign: "center" }}>
          {isLive ? `🔴 ${gameScore.detail}` : gameScore.state === "post" ? gameScore.detail : ""}
        </Typography>
      )}
      <TeamSlot
        team={teamA} isWinner={!!teamA && teamMatch(teamA, winner)}
        isCorrect={!!result && !!teamA && teamMatch(teamA, winner) && teamMatch(teamA, result)}
        isWrong={!!result && !!teamA && teamMatch(teamA, winner) && !teamMatch(teamA, result)}
        isActualWinner={!!result && !!teamA && teamMatch(teamA, result)}
        isEliminated={!!teamA && !!eliminated?.has(teamA.name)}
        score={gameScore?.teamA} isLive={isLive}
        onClick={() => teamA && onPick(teamA)} onPickTeam={onPick} locked={locked} position="top"
        pct={teamA && distribution?.[teamA.name] !== undefined ? distribution[teamA.name] : (teamA?.regionSeed && distribution?.[teamA.regionSeed] !== undefined ? distribution[teamA.regionSeed] : undefined)}
        regionColor={regionColor}
      />
      <TeamSlot
        team={teamB} isWinner={!!teamB && teamMatch(teamB, winner)}
        isCorrect={!!result && !!teamB && teamMatch(teamB, winner) && teamMatch(teamB, result)}
        isWrong={!!result && !!teamB && teamMatch(teamB, winner) && !teamMatch(teamB, result)}
        isActualWinner={!!result && !!teamB && teamMatch(teamB, result)}
        isEliminated={!!teamB && !!eliminated?.has(teamB.name)}
        score={gameScore?.teamB} isLive={isLive}
        onClick={() => teamB && onPick(teamB)} onPickTeam={onPick} locked={locked} position="bottom"
        pct={teamB && distribution?.[teamB.name] !== undefined ? distribution[teamB.name] : (teamB?.regionSeed && distribution?.[teamB.regionSeed] !== undefined ? distribution[teamB.regionSeed] : undefined)}
        regionColor={regionColor}
      />
    </Paper>
  );

  return seedTip ? (
    <Tooltip title={seedTip} arrow placement="top">
      {content}
    </Tooltip>
  ) : content;
}
