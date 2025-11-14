import { ReflectClass }    from '@itrocks/reflect'
import { ReflectProperty } from '@itrocks/reflect'

function parseParameters(rawParameters: string)
{
	let   index      = 0
	const parameters = new Array<number|string>
	while (index < rawParameters.length) {
		if ('"\''.includes(rawParameters[index])) {
			const delimiter = rawParameters[index]
			index ++
			const start = index
			while ((rawParameters[index] !== delimiter) && (index < rawParameters.length)) {
				if (rawParameters[index] === '\\') index ++
				index ++
			}
			parameters.push(rawParameters.substring(start, index))
			index = rawParameters.indexOf(',', index)
			if (index < 0) index = rawParameters.length
			index ++
		}
		else {
			const start = index
			index = rawParameters.indexOf(',', index)
			if (index < 0) index = rawParameters.length
			parameters.push(Number(rawParameters.substring(start, index).trim()))
			index ++
		}
		while ((index < rawParameters.length) && ['\n\t'].includes(rawParameters[index])) {
			index ++
		}
	}
	return parameters
}

export function parseReflect(variable: string, data: any)
{
	const typeOfDataChar = (typeof data)[0]
	if ((typeOfDataChar !== 'f') && (typeOfDataChar !== 'o')) {
		throw 'Could not parse ' + variable + ' for non-object ' + data
	}
	if (!((data instanceof ReflectClass) || (data instanceof ReflectProperty))) {
		data = new ReflectClass(data)
	}
	const parenthesis = variable.indexOf('(')
	if (parenthesis < 0) {
		const value = data[variable.substring(1)]
		return ((typeof value)[0] === 'f')
			? (value as Function).call(data)
			: value
	}
	else {
		const parameters = parseParameters(variable.substring(parenthesis + 1, variable.lastIndexOf(')')).trim())
		const value: Function = data[variable.substring(1, parenthesis)]
		return value.apply(data, parameters)
	}
}
