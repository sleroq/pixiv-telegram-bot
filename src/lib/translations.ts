import { Fluent } from '@moebius/fluent'
const fluent = new Fluent()

await fluent.addTranslation({
	locales: 'en-US',
	filePath: ['./locales/en.ftl'],
	bundleOptions: { useIsolating: false },
})

export default fluent
