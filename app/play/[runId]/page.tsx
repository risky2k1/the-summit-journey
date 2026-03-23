import { PlayRun } from "./play-run";

export default async function PlayRunPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  return <PlayRun runId={runId} />;
}
