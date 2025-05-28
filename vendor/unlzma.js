// https://www.npmjs.com/package/lzma/v/2.3.2
// Heavily modified from lzma-d.js.

function $Decoder$LenDecoder() {
	return {
		Choice: new Int16Array(2).fill(1024),
		LowCoder: Array.from({ length: 16 }, () => new Int16Array(1 << 3).fill(1024)),
		MidCoder: Array.from({ length: 16 }, () => new Int16Array(1 << 3).fill(1024)),
		HighCoder: new Int16Array(1 << 8).fill(1024),
	}
}

function unlzma(dest, src) {
	function $Decode(probs, posState) {
		if (!$DecodeBit(probs.Choice, 0)) {
			return $Decode_0(probs.LowCoder[posState])
		} else if (!$DecodeBit(probs.Choice, 1)) {
			return $Decode_0(probs.MidCoder[posState]) + 8
		} else {
			return $Decode_0(probs.HighCoder) + 16
		}
	}

	function $Decode_0(probs) {
		let m = 1
		do {
			m = m << 1 | $DecodeBit(probs, m)
		} while (m < probs.length)
		return m - probs.length
	}

	function $DecodeBit(probs, index) {
		const prob = probs[index]
		const newBound = (RangeDecoder.Range >>> 11) * prob
		const bit = (RangeDecoder.Code ^ -2147483648) >= (newBound ^ -2147483648)
		if (bit) {
			RangeDecoder.Range -= newBound
			RangeDecoder.Code -= newBound
			probs[index] = prob - (prob >>> 5)
		} else {
			RangeDecoder.Range = newBound
			probs[index] = prob + (2048 - prob >>> 5)
		}
		if (!(RangeDecoder.Range & -16777216)) {
			RangeDecoder.Code = RangeDecoder.Code << 8 | read()
			RangeDecoder.Range <<= 8
		}
		return +bit
	}

	const input = { buf: src, pos: 0 }
	function read() {
		if (input.pos >= input.buf.length) throw new Error('truncated input')
		return input.buf[input.pos++]
	}
	const RangeDecoder = {}
	const IsMatchDecoders = new Int16Array(192).fill(1024)
	const IsRepDecoders = new Int16Array(12).fill(1024)
	const IsRepG0Decoders = new Int16Array(12).fill(1024)
	const IsRepG1Decoders = new Int16Array(12).fill(1024)
	const IsRepG2Decoders = new Int16Array(12).fill(1024)
	const IsRep0LongDecoders = new Int16Array(192).fill(1024)
	const PosSlotDecoder = Array.from({ length: 4 }, () => new Int16Array(1 << 6).fill(1024))
	const PosDecoders = new Int16Array(114).fill(1024)
	const PosAlignDecoder = new Int16Array(1 << 4).fill(1024)
	const LenDecoder = $Decoder$LenDecoder()
	const RepLenDecoder = $Decoder$LenDecoder()
	const LiteralDecoder = {}
	{
		let val = read()
		const lc = val % 9
		val = val / 9 | 0
		const lp = val % 5
		const pb = val / 5 | 0
		if (lc > 8 || lp > 4 || pb > 4) throw new Error("corrupted input")
		LiteralDecoder.NumPosBits = lp
		LiteralDecoder.NumPrevBits = lc
		LiteralDecoder.Coders = Array.from(
			{ length: 1 << LiteralDecoder.NumPrevBits + LiteralDecoder.NumPosBits },
			() => new Int16Array(768).fill(1024)
		)
		PosStateMask = (1 << pb) - 1
	}
	let dictionarySize = 0
	for (let i = 0; i < 4; i++) {
		dictionarySize |= (read() & 255) << i * 8
	}
	dictionarySize = Math.max(1, dictionarySize)
	input.pos += 8 // skip length field; it is usually -1 anyway
	RangeDecoder.Code = 0
	RangeDecoder.Range = -1
	for (let i = 0; i < 5; i++) {
		RangeDecoder.Code <<= 8
		RangeDecoder.Code |= read()
	}
	let state = 0
	let rep0 = 0
	let rep1 = 0
	let rep2 = 0
	let rep3 = 0
	let outputPos = 0
	let prevByte = 0
	// loop body is $CodeOneChunk
	for (; ;) {
		const posState = outputPos & PosStateMask
		if (!$DecodeBit(IsMatchDecoders, (state << 4) + posState)) {
			// function $GetDecoder(this$static, pos, prevByte)
			const decoder2 = LiteralDecoder.Coders[
				((outputPos & (1 << LiteralDecoder.NumPosBits) - 1) << LiteralDecoder.NumPrevBits)
				+ (prevByte >>> 8 - LiteralDecoder.NumPrevBits)
			]
			if (state < 7) {
				// function $DecodeNormal(decoder2, rangeDecoder)
				let symbol = 1
				do {
					symbol = symbol << 1 | $DecodeBit(decoder2, symbol)
				} while (symbol < 256)
				prevByte = symbol & 255
			} else {
				// function $DecodeWithMatchByte(this$static, rangeDecoder, matchByte)
				let matchByte = dest[outputPos - rep0 - 1]
				let symbol = 1
				do {
					const matchBit = matchByte >> 7 & 1
					matchByte <<= 1
					const bit = $DecodeBit(decoder2, (1 + matchBit << 8) + symbol)
					symbol = symbol << 1 | bit
					if (matchBit !== bit) {
						while (symbol < 256) {
							symbol = symbol << 1 | $DecodeBit(decoder2, symbol)
						}
						break
					}
				} while (symbol < 256)
				prevByte = symbol & 255
			}
			dest[outputPos++] = prevByte
			state = state < 4 ? 0 : state < 10 ? state - 3 : state - 6 // StateUpdateChar(state)
		} else {
			let len = 0
			if ($DecodeBit(IsRepDecoders, state)) {
				if (!$DecodeBit(IsRepG0Decoders, state)) {
					if (!$DecodeBit(IsRep0LongDecoders, (state << 4) + posState)) {
						state = state < 7 ? 9 : 11
						len = 1
					}
				} else {
					let distance
					if (!$DecodeBit(IsRepG1Decoders, state)) {
						distance = rep1
					} else {
						if (!$DecodeBit(IsRepG2Decoders, state)) {
							distance = rep2
						} else {
							distance = rep3
							rep3 = rep2
						}
						rep2 = rep1
					}
					rep1 = rep0
					rep0 = distance
				}
				if (!len) {
					len = $Decode(RepLenDecoder, posState) + 2
					state = state < 7 ? 8 : 11
				}
			} else {
				rep3 = rep2
				rep2 = rep1
				rep1 = rep0
				len = $Decode(LenDecoder, posState) + 2
				state = state < 7 ? 7 : 10
				const posSlot = $Decode_0(PosSlotDecoder[len < 6 ? len - 2 : 3 /* GetLenToPosState */])
				if (posSlot >= 4) {
					const numDirectBits = (posSlot >> 1) - 1
					rep0 = (2 | posSlot & 1) << numDirectBits
					if (posSlot < 14) {
						// function ReverseDecode(Models, startIndex, rangeDecoder, NumBitLevels)
						const startIndex = rep0 - posSlot - 1
						let m = 1, symbol = 0
						for (let bitIndex = 0; bitIndex < numDirectBits; bitIndex++) {
							const bit = $DecodeBit(PosDecoders, startIndex + m)
							m <<= 1
							m += bit
							symbol |= bit << bitIndex
						}
						rep0 += symbol
					} else {
						// function $DecodeDirectBits(this$static, numTotalBits)
						{
							let result = 0
							for (let i = numDirectBits - 4; i; --i) {
								RangeDecoder.Range >>>= 1
								const t = RangeDecoder.Code - RangeDecoder.Range >>> 31
								RangeDecoder.Code -= RangeDecoder.Range & t - 1
								result = result << 1 | 1 - t
								if (!(RangeDecoder.Range & -16777216)) {
									RangeDecoder.Code = RangeDecoder.Code << 8 | read()
									RangeDecoder.Range <<= 8
								}
							}
							rep0 += result << 4
						}
						// function $ReverseDecode(this$static, rangeDecoder)
						{
							let m = 1
							for (let bitIndex = 0; bitIndex < 4; bitIndex++) {
								const bit = $DecodeBit(PosAlignDecoder, m)
								m = m << 1 | bit
								rep0 += bit << bitIndex
							}
						}
						if (rep0 === -1) break
						if (rep0 < 0) throw new Error('corrupted input')
					}
				} else {
					rep0 = posSlot
				}
			}
			if (rep0 >= outputPos || rep0 >= dictionarySize) throw new Error('corrupted input')
			// function $CopyBlock(this$static, distance, len)
			for (let i = 0, pos = outputPos - rep0 - 1; i < len; i++) {
				dest[outputPos++] = dest[pos++]
			}
			prevByte = dest[outputPos - 1]
		}
	}
	return outputPos
}
