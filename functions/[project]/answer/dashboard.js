export async function onRequest(context) {
	const [
		{ results: latest },
		{ results: most },
	] = await context.env.answer_log.batch([
		// (correct = false or correct = true) so that the query utilizes the index.
		context.env.answer_log.prepare(
			'select time, input from answer_log where project = ? and (correct = false or correct = true) order by id desc limit 50'
		).bind(context.params.project),
		context.env.answer_log.prepare(
			'select input, count(*) as frequency from answer_log where project = ? and (correct = false or correct = true) group by input order by frequency desc limit 20'
		).bind(context.params.project),
	])
	return new Response(
		latest.map(({ time, input }) => `${time} ${input}`).join('\n')
		+ '\n\n\n' + most.map(({ input, frequency }) => `${frequency}\t${input}`).join('\n')
	)
}
