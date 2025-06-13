/*
create table answer_log (
	id integer primary key,
	project text not null,
	input text not null,
	correct integer not null,
	time text not null default current_timestamp
) strict;
create index answer_log_index on answer_log (correct, project, input);
*/

import { hashAnswer } from '../../../common/answer.js'

// GET /<project>/answer/<hash>?input=<string> = check answer
export async function onRequest(context) {
	try {
		if (context.request.method !== 'GET') {
			return new Response('?', { status: 405 })
		}
		if (context.request.url.length > 1919) {
			return new Response('😾', { status: 414 })
		}
		const url = new URL(context.request.url)
		const input = url.searchParams.get('input')
		if (!input) {
			return new Response('input?', { status: 400 })
		}
		if (context.params.input !== await hashAnswer(input)) {
			return new Response('input!?', { status: 400 })
		}
		const response = await context.env.ASSETS.fetch(context.request)
		const text = response.ok ? await response.text() : ''
		if (text.startsWith('✓')) {
			const [
				{ success: insertSuccess },
				{ success: selectSuccess, results: [{ rank }] },
			] = await context.env.answer_log.batch([
				context.env.answer_log.prepare(
					'insert into answer_log (project, input, correct) values (?, ?, true)'
				).bind(context.params.project, input),
				context.env.answer_log.prepare(
					'select count(*) as rank from answer_log where project = ? and correct = true'
				).bind(context.params.project),
			])
			if (!insertSuccess || !selectSuccess) {
				return new Response(':(', { status: 424 })
			}
			return new Response(text.replace('#?', '#' + rank))
		} else {
			const { success } = await context.env.answer_log.prepare(
				'insert into answer_log (project, input, correct) values (?, ?, false)'
			).bind(context.params.project, input).run()
			if (!success) {
				return new Response(':(', { status: 424 })
			}
			return response
		}
	} catch (error) {
		return new Response(error.stack, { status: 500 })
	}
}
