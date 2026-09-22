export const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export async function purgeExpiredCaptures(env: Env): Promise<{ deleted: number }> {
	const cutoff = Date.now() - RETENTION_MS;
	const rows = await env.DB.prepare("SELECT body_r2_key FROM captures WHERE received_at_ms < ?")
		.bind(cutoff)
		.all<{ body_r2_key: string | null }>();

	const keys = rows.results
		.map((row) => row.body_r2_key)
		.filter((key): key is string => key != null && key.length > 0);

	for (let i = 0; i < keys.length; i += 1000) {
		await env.BUCKET.delete(keys.slice(i, i + 1000));
	}

	const result = await env.DB.prepare("DELETE FROM captures WHERE received_at_ms < ?")
		.bind(cutoff)
		.run();
	const deleted = result.meta.changes ?? keys.length;
	console.log({ msg: "retention_purge", deleted, cutoff });
	return { deleted };
}
