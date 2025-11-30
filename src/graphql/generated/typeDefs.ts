import type { DocumentNode } from 'graphql'
export const typeDefs = {
  kind: 'Document',
  definitions: [
    {
      kind: 'ScalarTypeDefinition',
      name: { kind: 'Name', value: 'DateTimeISO' },
      directives: [],
    },
    {
      kind: 'ObjectTypeDefinition',
      name: { kind: 'Name', value: 'BudgetEntry' },
      interfaces: [],
      directives: [],
      fields: [
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'alloys' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'consumerGoods' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'energy' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'engineeringResearch' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'food' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'influence' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'minerals' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'physicsResearch' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'societyResearch' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'trade' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'unity' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } },
          directives: [],
        },
      ],
    },
    {
      kind: 'ObjectTypeDefinition',
      name: { kind: 'Name', value: 'BudgetCategory' },
      interfaces: [],
      directives: [],
      fields: [
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'armies' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'countryBase' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'countryPowerProjection' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'leaderCommanders' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'leaderOfficials' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'leaderScientists' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'orbitalMiningDeposits' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'orbitalResearchDeposits' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'planetArtisans' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'planetBiologists' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'planetBuildings' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'planetBuildingsStrongholds' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'planetBureaucrats' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'planetDistrictsCities' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'planetDistrictsFarming' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'planetDistrictsGenerator' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'planetDistrictsMining' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'planetDoctors' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'planetEngineers' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'planetFarmers' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'planetJobs' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'planetMetallurgists' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'planetMiners' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'planetPhysicists' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'planetPoliticians' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'planetPops' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'planetResourceDeficit' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'planetTechnician' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'planetTraders' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'popCategoryRulers' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'popCategorySpecialists' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'popCategoryWorkers' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'popFactions' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'shipComponents' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'ships' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'starbaseBuildings' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'starbaseModules' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'starbases' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'stationGatherers' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'stationResearchers' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'tradePolicy' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
      ],
    },
    {
      kind: 'ObjectTypeDefinition',
      name: { kind: 'Name', value: 'Budget' },
      interfaces: [],
      directives: [],
      fields: [
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'income' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'BudgetCategory' },
            },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'expenses' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'BudgetCategory' },
            },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'balance' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'BudgetCategory' },
            },
          },
          directives: [],
        },
      ],
    },
    {
      kind: 'ObjectTypeDefinition',
      name: { kind: 'Name', value: 'Gamestate' },
      interfaces: [],
      directives: [],
      fields: [
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'gamestateId' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'date' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'DateTimeISO' },
            },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'budget' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'Budget' },
            },
          },
          directives: [],
        },
      ],
    },
    {
      kind: 'ObjectTypeDefinition',
      name: { kind: 'Name', value: 'Save' },
      interfaces: [],
      directives: [],
      fields: [
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'saveId' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'filename' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'String' },
            },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'name' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'String' },
            },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'gamestates' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'ListType',
              type: {
                kind: 'NonNullType',
                type: {
                  kind: 'NamedType',
                  name: { kind: 'Name', value: 'Gamestate' },
                },
              },
            },
          },
          directives: [],
        },
      ],
    },
    {
      kind: 'ObjectTypeDefinition',
      name: { kind: 'Name', value: 'Query' },
      interfaces: [],
      directives: [],
      fields: [
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'saves' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'ListType',
              type: {
                kind: 'NonNullType',
                type: {
                  kind: 'NamedType',
                  name: { kind: 'Name', value: 'Save' },
                },
              },
            },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'save' },
          arguments: [
            {
              kind: 'InputValueDefinition',
              name: { kind: 'Name', value: 'filename' },
              type: {
                kind: 'NonNullType',
                type: {
                  kind: 'NamedType',
                  name: { kind: 'Name', value: 'String' },
                },
              },
              directives: [],
            },
          ],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Save' } },
          directives: [],
        },
      ],
    },
    {
      kind: 'SchemaDefinition',
      operationTypes: [
        {
          kind: 'OperationTypeDefinition',
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Query' } },
          operation: 'query',
        },
      ],
    },
  ],
} as unknown as DocumentNode
