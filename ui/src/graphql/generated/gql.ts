/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
const documents = {
    "query GetSaves {\n  saves {\n    saveId\n    filename\n    name\n  }\n}\n\nquery GetSave($filename: String!) {\n  save(filename: $filename) {\n    saveId\n    filename\n    name\n    gamestates {\n      gamestateId\n      date\n    }\n  }\n}\n\nquery GetBudget($filename: String!) {\n  save(filename: $filename) {\n    saveId\n    filename\n    name\n    gamestates {\n      gamestateId\n      date\n      budget {\n        balance {\n          countryBase {\n            energy\n            minerals\n            food\n            trade\n            alloys\n            consumerGoods\n            unity\n            influence\n          }\n        }\n      }\n    }\n  }\n}": types.GetSavesDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query GetSaves {\n  saves {\n    saveId\n    filename\n    name\n  }\n}\n\nquery GetSave($filename: String!) {\n  save(filename: $filename) {\n    saveId\n    filename\n    name\n    gamestates {\n      gamestateId\n      date\n    }\n  }\n}\n\nquery GetBudget($filename: String!) {\n  save(filename: $filename) {\n    saveId\n    filename\n    name\n    gamestates {\n      gamestateId\n      date\n      budget {\n        balance {\n          countryBase {\n            energy\n            minerals\n            food\n            trade\n            alloys\n            consumerGoods\n            unity\n            influence\n          }\n        }\n      }\n    }\n  }\n}"): (typeof documents)["query GetSaves {\n  saves {\n    saveId\n    filename\n    name\n  }\n}\n\nquery GetSave($filename: String!) {\n  save(filename: $filename) {\n    saveId\n    filename\n    name\n    gamestates {\n      gamestateId\n      date\n    }\n  }\n}\n\nquery GetBudget($filename: String!) {\n  save(filename: $filename) {\n    saveId\n    filename\n    name\n    gamestates {\n      gamestateId\n      date\n      budget {\n        balance {\n          countryBase {\n            energy\n            minerals\n            food\n            trade\n            alloys\n            consumerGoods\n            unity\n            influence\n          }\n        }\n      }\n    }\n  }\n}"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;