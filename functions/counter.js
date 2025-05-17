const textEncoder = new TextEncoder

export function onRequest(context) {
	const { readable, writable } = new TransformStream
	const writer = writable.getWriter()
	writer.write(new Uint8Array([0x31, 0x31, 0x34, 0x35, 0x31, 0x34, 0x0a]))
	// context.waitUntil(new Promise(resolve => {
		let i = 0
		setTimeout(function next() {
			writer.write(textEncoder.encode(`${Date()} = ${i++}\n`))
			if (i < 1000) {
				setTimeout(next, 400)
			} else {
				// resolve()
			}
		}, 400)
	// }))
	return new Response(readable, {
		headers: {
			'Content-Type': 'text/plain',
			'X-My-Header': '114514',
		}
	})
}
