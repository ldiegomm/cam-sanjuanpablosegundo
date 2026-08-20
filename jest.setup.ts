import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Polyfills for Next.js
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

// Mock fetch
global.fetch = jest.fn()

// Mock Headers
class MockHeaders extends Map {
  append(name: string, value: string) {
    this.set(name, value)
  }
  delete(name: string): boolean {
    return super.delete(name)
  }
  get(name: string): string | null {
    return super.get(name) || null
  }
  has(name: string): boolean {
    return super.has(name)
  }
  set(name: string, value: string): this {
    super.set(name, value)
    return this
  }
  forEach(callbackfn: (value: string, key: string) => void): void {
    super.forEach(callbackfn)
  }
}

global.Headers = MockHeaders as any

// Mock Request for Next.js API routes
global.Request = class MockRequest {
  url: string
  method: string
  headers: Headers
  body: any
  _bodyInit: any

  constructor(url: string, init?: any) {
    this.url = url
    this.method = init?.method || 'GET'
    this.headers = new MockHeaders() as any
    this._bodyInit = init?.body
  }

  async json() {
    if (typeof this._bodyInit === 'string') {
      return JSON.parse(this._bodyInit)
    }
    return this._bodyInit || {}
  }

  async text() {
    return typeof this._bodyInit === 'string' ? this._bodyInit : JSON.stringify(this._bodyInit || '')
  }
} as any

// Mock Response for Next.js API routes
class MockResponse {
  body: any
  status: number
  statusText: string
  headers: Headers
  ok: boolean
  _bodyInit: any

  constructor(body?: any, init?: any) {
    this._bodyInit = body
    this.body = body
    this.status = init?.status || 200
    this.statusText = init?.statusText || 'OK'
    this.headers = init?.headers || new MockHeaders()
    this.ok = this.status >= 200 && this.status < 300
  }

  async json() {
    if (typeof this._bodyInit === 'string') {
      return JSON.parse(this._bodyInit)
    }
    return this._bodyInit || {}
  }

  async text() {
    return typeof this._bodyInit === 'string' ? this._bodyInit : JSON.stringify(this._bodyInit || '')
  }

  static json(data: any, init?: any): MockResponse {
    const body = JSON.stringify(data)
    const headers = new MockHeaders()
    headers.set('content-type', 'application/json')
    return new MockResponse(body, {
      ...init,
      headers: init?.headers || headers,
    })
  }
}

global.Response = MockResponse as any

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => Promise.resolve({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
  headers: jest.fn(() => Promise.resolve(new Map())),
}))
