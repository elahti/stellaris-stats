import type { Request, Response, NextFunction } from 'express'
import { ApolloServer, HeaderMap } from '@apollo/server'

export interface ExpressMiddlewareOptions<TContext extends object> {
  context: (req: Request, res: Response) => Promise<TContext>
}

export const expressMiddleware = <TContext extends object>(
  server: ApolloServer<TContext>,
  options: ExpressMiddlewareOptions<TContext>,
): ((req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, res: Response, _next: NextFunction): void => {
    void (async () => {
      const headers = new HeaderMap()
      for (const [key, value] of Object.entries(req.headers)) {
        if (value !== undefined) {
          headers.set(key, Array.isArray(value) ? value.join(', ') : value)
        }
      }

      const httpGraphQLRequest = {
        method: req.method,
        headers,
        search:
          req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '',
        body: req.body as unknown,
      }

      const context = await options.context(req, res)
      const result = await server.executeHTTPGraphQLRequest({
        httpGraphQLRequest,
        context: () => Promise.resolve(context),
      })

      for (const [key, value] of result.headers) {
        res.setHeader(key, value)
      }

      res.status(result.status ?? 200)

      if (result.body.kind === 'complete') {
        res.send(result.body.string)
      } else {
        for await (const chunk of result.body.asyncIterator) {
          res.write(chunk)
        }
        res.end()
      }
    })()
  }
}
