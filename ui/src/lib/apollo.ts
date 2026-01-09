import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { createClient } from 'graphql-ws'
import { OperationTypeNode } from 'graphql'

const httpLink = new HttpLink({
  uri: '/graphql',
})

const wsLink = new GraphQLWsLink(
  createClient({
    url: `ws://${window.location.host}/graphql`,
  }),
)

const splitLink = split(
  ({ operationType }) => operationType === OperationTypeNode.SUBSCRIPTION,
  wsLink,
  httpLink,
)

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
})
