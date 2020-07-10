import { degreesToCompass } from "./utils";

test('degreesToCompass calculates correctly', () => {
	expect(degreesToCompass(0)).toEqual("N");
	expect(degreesToCompass(11)).toEqual("N");
	expect(degreesToCompass(12)).toEqual("NNE");
	expect(degreesToCompass(33)).toEqual("NNE");
	expect(degreesToCompass(34)).toEqual("NE");
	expect(degreesToCompass(56)).toEqual("NE");
	expect(degreesToCompass(57)).toEqual("ENE");
	expect(degreesToCompass(78)).toEqual("ENE");
	expect(degreesToCompass(79)).toEqual("E");
	expect(degreesToCompass(101)).toEqual("E");
	expect(degreesToCompass(102)).toEqual("ESE");
	expect(degreesToCompass(123)).toEqual("ESE");
	expect(degreesToCompass(124)).toEqual("SE");
	expect(degreesToCompass(146)).toEqual("SE");
	expect(degreesToCompass(147)).toEqual("SSE");
	expect(degreesToCompass(168)).toEqual("SSE");
	expect(degreesToCompass(169)).toEqual("S");
	expect(degreesToCompass(191)).toEqual("S");
	expect(degreesToCompass(192)).toEqual("SSW");
	expect(degreesToCompass(213)).toEqual("SSW");
	expect(degreesToCompass(214)).toEqual("SW");
	expect(degreesToCompass(236)).toEqual("SW");
	expect(degreesToCompass(237)).toEqual("WSW");
	expect(degreesToCompass(258)).toEqual("WSW");
	expect(degreesToCompass(259)).toEqual("W");
	expect(degreesToCompass(281)).toEqual("W");
	expect(degreesToCompass(282)).toEqual("WNW");
	expect(degreesToCompass(303)).toEqual("WNW");
	expect(degreesToCompass(304)).toEqual("NW");
	expect(degreesToCompass(326)).toEqual("NW");
	expect(degreesToCompass(327)).toEqual("NNW");
	expect(degreesToCompass(348)).toEqual("NNW");
	expect(degreesToCompass(349)).toEqual("N");
	expect(degreesToCompass(359)).toEqual("N");
	expect(degreesToCompass(360)).toEqual("N");
});
