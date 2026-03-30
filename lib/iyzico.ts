// Use require for iyzipay to avoid Turbopack import issues with its internal structure
const Iyzipay = require('iyzipay')

const iyzico = new Iyzipay({
    apiKey: process.env.NEXT_PUBLIC_IYZICO_API_KEY,
    secretKey: process.env.NEXT_PUBLIC_IYZICO_SECRET_KEY,
    uri: process.env.IYZICO_BASE_URL || 'https://sandbox.iyzipay.com'
})

export default iyzico
