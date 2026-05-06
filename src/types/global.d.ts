// Type shims for packages that may not be installed locally
// These are resolved by their real types when installed (Vercel / npm install)

declare module "@neondatabase/serverless" {
  export function neon(connStr: string): any;
}

declare module "@vercel/blob" {
  export function put(
    pathname: string,
    body: Buffer | string,
    options?: { access?: "public"; contentType?: string }
  ): Promise<{ url: string; downloadUrl: string; pathname: string }>;
  export function del(url: string | string[]): Promise<void>;
}

declare module "pg" {
  export class Pool {
    constructor(config?: { connectionString?: string });
    query(text: string, params?: any[]): Promise<any>;
  }
}
