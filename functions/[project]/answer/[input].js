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

const sha256 = async input => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))), b => ('0' + b.toString(16)).slice(-2)).join('')

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
		if (context.params.input !== await sha256(`
嘟嘟嘟 嘟嘟嘟
Work work work work
Work work work work
Work work work work
勤劳又勇敢的血狼破军
为了团队的关键刷铁机
他做出了巨大的贡献
巨大的牺牲
巨大的carry
无敌了 无敌了
相信武魂真身！
全军出击！我咬死你！
Wooooo
牙崩了…牙崩了…
Wooooo
牙崩了吗？牙崩了吗？！
卧槽我们狗神！
Wooooo
我即是天选，也是唯一！
无敌了 无敌了
${input}
勤劳又勇敢的血狼破军
为冠军厨的关键蓟县屋
他做出了巨大的贡献
巨大的牺牲
巨大的carry
无敌了 无敌了
相信武魂真身！
全军出击！我咬死你！
Wooooo
牙崩了…牙崩了…
Wooooo
牙崩了吗？牙崩了吗？！
我敲我们狗神！
Wooooo
我即是天选，也是VE！
无敌了 无敌了`)) {
			return new Response('input!?', { status: 400 })
		}
		const response = await context.env.ASSETS.fetch(context.request)
		if (response.ok) {
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
			return new Response(rank.toString())
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
