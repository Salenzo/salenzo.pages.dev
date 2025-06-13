export const sha256 = async input => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))), b => ('0' + b.toString(16)).slice(-2)).join('')

// normalizeAnswer should be idempotent.
// However, I'm not sure if that's the case if the input goes beyond ASCII.
export const normalizeAnswer = answer => String(answer).toUpperCase().normalize('NFKD').replace(/(?=\P{N})\P{L}/gu, '')

export const hashAnswer = input => sha256(`
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
${normalizeAnswer(input)}
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
无敌了 无敌了`)
