import app from "./app";
import { logger } from "./lib/logger";
import { refreshVotesCache, startVotesCacheTimer } from "./lib/trader";
import { loadMlState, saveMlState } from "./lib/persistence";

// Restore learned weights and pattern history before serving any requests
loadMlState();

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // After market cache warms up (~3s), do first votes computation then start background timer
  setTimeout(async () => {
    await refreshVotesCache();
    startVotesCacheTimer();
    logger.info("Votes cache initialized");
  }, 4_000);

  // Persist ML state every 5 minutes so learned weights survive restarts
  setInterval(saveMlState, 5 * 60_000);
});

// Save ML state before the process exits (SIGTERM from workflow restart, Ctrl-C, etc.)
function shutdown() {
  saveMlState();
  logger.info("ML state saved on shutdown");
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
