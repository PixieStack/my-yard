import crypto from "crypto"

export interface OzowPaymentRequest {
  siteCode: string
  countryCode: string
  currencyCode: string
  amount: number // in cents
  transactionReference: string
  bankReference: string
  customer: string
  optional1?: string
  optional2?: string
  optional3?: string
  optional4?: string
  optional5?: string
  cancelUrl: string
  errorUrl: string
  successUrl: string
  notifyUrl: string
  isTest: boolean
}

export interface OzowConfig {
  siteCode: string
  privateKey: string
  apiKey: string
  apiUrl: string
  isTest: boolean
}

export class OzowPaymentService {
  private config: OzowConfig

  constructor() {
    this.config = {
      siteCode: process.env.OZOW_SITE_CODE || "",
      privateKey: process.env.OZOW_PRIVATE_KEY || "",
      apiKey: process.env.OZOW_API_KEY || "",
      apiUrl:
        process.env.OZOW_API_URL ||
        "https://stagingapi.ozow.com/PostPaymentRequest",
      isTest: process.env.OZOW_IS_TEST === "true",
    }
  }

  /**
   * Generate SHA512 hash for Ozow payment request
   */
  generateHash(data: OzowPaymentRequest): string {
    const sortedKeys = Object.keys(data).sort()
    const hashInput = sortedKeys
      .map((key) => {
        const value = data[key as keyof OzowPaymentRequest]
        return value !== undefined ? String(value).toLowerCase() : ""
      })
      .join("")

    const hashString = hashInput + this.config.privateKey

    return crypto.createHash("sha512").update(hashString).digest("hex")
  }

  /**
   * Verify Ozow webhook notification hash
   */
  verifyWebhookHash(data: any): boolean {
    const receivedHash = data.Hash
    if (!receivedHash) return false

    const dataWithoutHash = { ...data }
    delete dataWithoutHash.Hash

    const calculatedHash = this.generateHash(dataWithoutHash as OzowPaymentRequest)
    return calculatedHash === receivedHash.toLowerCase()
  }

  /**
   * Create move-in payment request
   */
  createMoveInPayment(params: {
    transactionId: string
    userId: string
    userEmail: string
    userName: string
    propertyTitle: string
    depositAmount: number
    rentAmount: number
    utilitiesAmount: number
    adminFee: number
  }): { url: string; hash: string; request: OzowPaymentRequest } {
    const totalAmount =
      params.depositAmount +
      params.rentAmount +
      params.utilitiesAmount +
      params.adminFee

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    const request: OzowPaymentRequest = {
      siteCode: this.config.siteCode,
      countryCode: "ZA",
      currencyCode: "ZAR",
      amount: totalAmount,
      transactionReference: params.transactionId,
      bankReference: `MOVEIN-${params.transactionId.substring(0, 8)}`,
      customer: params.userEmail,
      optional1: params.userId,
      optional2: "move_in",
      optional3: params.propertyTitle,
      optional4: JSON.stringify({
        deposit: params.depositAmount,
        rent: params.rentAmount,
        utilities: params.utilitiesAmount,
        adminFee: params.adminFee,
      }),
      optional5: params.userName,
      cancelUrl: `${baseUrl}/payments/cancel`,
      errorUrl: `${baseUrl}/payments/error`,
      successUrl: `${baseUrl}/payments/success`,
      notifyUrl: `${baseUrl}/api/payments/notify`,
      isTest: this.config.isTest,
    }

    const hash = this.generateHash(request)

    const queryParams = new URLSearchParams({
      SiteCode: request.siteCode,
      CountryCode: request.countryCode,
      CurrencyCode: request.currencyCode,
      Amount: request.amount.toString(),
      TransactionReference: request.transactionReference,
      BankReference: request.bankReference,
      Customer: request.customer,
      Optional1: request.optional1 || "",
      Optional2: request.optional2 || "",
      Optional3: request.optional3 || "",
      Optional4: request.optional4 || "",
      Optional5: request.optional5 || "",
      CancelUrl: request.cancelUrl,
      ErrorUrl: request.errorUrl,
      SuccessUrl: request.successUrl,
      NotifyUrl: request.notifyUrl,
      IsTest: request.isTest.toString(),
      HashCheck: hash,
    })

    return {
      url: `${this.config.apiUrl}?${queryParams.toString()}`,
      hash,
      request,
    }
  }

  /**
   * Create monthly rent payment request
   */
  createRentPayment(params: {
    transactionId: string
    userId: string
    userEmail: string
    userName: string
    propertyTitle: string
    rentAmount: number
    utilitiesAmount: number
  }): { url: string; hash: string; request: OzowPaymentRequest } {
    const totalAmount = params.rentAmount + params.utilitiesAmount
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    const request: OzowPaymentRequest = {
      siteCode: this.config.siteCode,
      countryCode: "ZA",
      currencyCode: "ZAR",
      amount: totalAmount,
      transactionReference: params.transactionId,
      bankReference: `RENT-${params.transactionId.substring(0, 8)}`,
      customer: params.userEmail,
      optional1: params.userId,
      optional2: "monthly_rent",
      optional3: params.propertyTitle,
      optional4: JSON.stringify({
        rent: params.rentAmount,
        utilities: params.utilitiesAmount,
      }),
      optional5: params.userName,
      cancelUrl: `${baseUrl}/payments/cancel`,
      errorUrl: `${baseUrl}/payments/error`,
      successUrl: `${baseUrl}/payments/success`,
      notifyUrl: `${baseUrl}/api/payments/notify`,
      isTest: this.config.isTest,
    }

    const hash = this.generateHash(request)

    const queryParams = new URLSearchParams(
      Object.entries(request).reduce(
        (acc, [key, value]) => {
          acc[key.charAt(0).toUpperCase() + key.slice(1)] =
            value !== undefined ? String(value) : ""
          return acc
        },
        {} as Record<string, string>
      )
    )
    queryParams.set("HashCheck", hash)

    return {
      url: `${this.config.apiUrl}?${queryParams.toString()}`,
      hash,
      request,
    }
  }

  /**
   * Calculate admin fee: R375 or 15% of rent (whichever is less)
   */
  calculateAdminFee(rentAmount: number): number {
    const R375_IN_CENTS = 37500
    const fifteenPercent = Math.floor((rentAmount * 15) / 100)
    return Math.min(R375_IN_CENTS, fifteenPercent)
  }

  /**
   * Get cancellation penalty amount (R300)
   */
  getCancellationPenalty(): number {
    return 30000 // R300 in cents
  }
}

export const ozowService = new OzowPaymentService()
