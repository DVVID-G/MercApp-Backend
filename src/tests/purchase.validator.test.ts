import { CreatePurchaseSchema } from '../validators/purchase.validator'

test('purchase validator acepta item con todos los campos requeridos', () => {
  const payload = { items: [{ name: 'Test', price: 10, quantity: 1, marca: 'Brand', packageSize: 100, umd: 'gramos', barcode: 'TEST001', categoria: 'Otros' }] }
  const res = CreatePurchaseSchema.safeParse(payload)
  expect(res.success).toBe(true)
})

test('purchase validator rechaza item sin campos requeridos', () => {
  const payload = { items: [{ name: 'X', price: 1.5, quantity: 2 }] }
  const res = CreatePurchaseSchema.safeParse(payload)
  expect(res.success).toBe(false)
})

test('purchase validator rechaza item sin marca', () => {
  const payload = { items: [{ name: 'X', price: 1.5, quantity: 2, packageSize: 100, umd: 'gramos', barcode: 'TEST001', categoria: 'Otros' }] }
  const res = CreatePurchaseSchema.safeParse(payload)
  expect(res.success).toBe(false)
})

test('ListPurchasesQuery preprocess convierte strings a numeros y acepta valores validos', () => {
  const { ListPurchasesQuery } = require('../validators/purchase.validator')
  const payload = { page: '2', limit: '10' }
  const res = ListPurchasesQuery.safeParse(payload)
  expect(res.success).toBe(true)
  if (res.success) {
    expect(res.data.page).toBe(2)
    expect(res.data.limit).toBe(10)
  }
})

test('ListPurchasesQuery rechaza limit mayor a 100 o page negativo', () => {
  const { ListPurchasesQuery } = require('../validators/purchase.validator')
  const bad1 = { limit: '101' }
  const bad2 = { page: '-1' }
  expect(ListPurchasesQuery.safeParse(bad1).success).toBe(false)
  expect(ListPurchasesQuery.safeParse(bad2).success).toBe(false)
})
