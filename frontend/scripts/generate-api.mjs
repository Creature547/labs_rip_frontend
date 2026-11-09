import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { generateApi } from 'swagger-typescript-api'

const spec = JSON.parse(await readFile(new URL('../openapi/swagger.json', import.meta.url), 'utf8'))
// Login and logout use plain Axios in this lab. Generate the equipment domain only.
spec.paths = Object.fromEntries(Object.entries(spec.paths).filter(([path]) => path.startsWith('/heating-equipment')))
for (const operations of Object.values(spec.paths)) {
  for (const operation of Object.values(operations)) {
    operation.operationId = 'heatingEquipment' + operation.operationId
  }
}
// The Go serializer writes each Equipment field, including zero and empty values.
spec.definitions.Equipment.required = Object.keys(spec.definitions.Equipment.properties)
await generateApi({
  spec, output: resolve('src/api/generated'), fileName: 'Api.ts',
  httpClientType: 'axios', name: 'Api.ts',
})
