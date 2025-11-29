import { GraphQLScalarType } from 'graphql'
export const DateTimeISO = new GraphQLScalarType({
  name: 'DateTimeISO',
  description: 'DateTimeISO description',
  serialize: (_argsvalue) => {
    /* Implement logic to turn the returned value from resolvers to a value that can be sent to clients */
  },
  parseValue: (_value) => {
    /* Implement logic to parse input that was sent to the server as variables */
  },
  parseLiteral: (_ast) => {
    /* Implement logic to parse input that was sent to the server as literal values (string, number, or boolean) */
  },
})
