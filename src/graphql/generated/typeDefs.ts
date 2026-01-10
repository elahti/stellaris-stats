import type { DocumentNode } from 'graphql'
export const typeDefs = {
  kind: 'Document',
  definitions: [
    {
      kind: 'DirectiveDefinition',
      name: { kind: 'Name', value: 'cacheControl' },
      arguments: [
        {
          kind: 'InputValueDefinition',
          name: { kind: 'Name', value: 'maxAge' },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          directives: [],
        },
        {
          kind: 'InputValueDefinition',
          name: { kind: 'Name', value: 'scope' },
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'CacheControlScope' },
          },
          directives: [],
        },
      ],
      repeatable: false,
      locations: [
        { kind: 'Name', value: 'FIELD_DEFINITION' },
        { kind: 'Name', value: 'OBJECT' },
        { kind: 'Name', value: 'INTERFACE' },
      ],
    },
    {
      kind: 'ScalarTypeDefinition',
      name: { kind: 'Name', value: 'DateTimeISO' },
      directives: [],
    },
    {
      kind: 'EnumTypeDefinition',
      name: { kind: 'Name', value: 'CacheControlScope' },
      directives: [],
      values: [
        {
          kind: 'EnumValueDefinition',
          name: { kind: 'Name', value: 'PUBLIC' },
          directives: [],
        },
        {
          kind: 'EnumValueDefinition',
          name: { kind: 'Name', value: 'PRIVATE' },
          directives: [],
        },
      ],
    },
    {
      kind: 'ObjectTypeDefinition',
      name: { kind: 'Name', value: 'BudgetEntry' },
      interfaces: [],
      directives: [
        {
          kind: 'Directive',
          name: { kind: 'Name', value: 'cacheControl' },
          arguments: [],
        },
      ],
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
          name: { kind: 'Name', value: 'astralThreads' },
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
          name: { kind: 'Name', value: 'exoticGases' },
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
          name: { kind: 'Name', value: 'minorArtifacts' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'nanites' },
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
          name: { kind: 'Name', value: 'rareCrystals' },
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
          name: { kind: 'Name', value: 'srDarkMatter' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'srLivingMetal' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'srZro' },
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
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'volatileMotes' },
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
      directives: [
        {
          kind: 'Directive',
          name: { kind: 'Name', value: 'cacheControl' },
          arguments: [],
        },
      ],
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
          name: { kind: 'Name', value: 'colonies' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'commercialPacts' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'countryAgendas' },
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
          name: { kind: 'Name', value: 'countryCivics' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'countryDessanu' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'countryEthic' },
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
          name: { kind: 'Name', value: 'countryRuler' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'edicts' },
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
          name: { kind: 'Name', value: 'megastructures' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'megastructuresGrandArchive' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'megastructuresHabitat' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'megastructuresHyperRelay' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'migrationPacts' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'none' },
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
          name: { kind: 'Name', value: 'overlordSubsidy' },
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
          name: { kind: 'Name', value: 'planetBuildingsCloneVats' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'planetBuildingsHabCapital' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'planetBuildingsStormTech' },
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
          name: { kind: 'Name', value: 'planetCivilians' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'planetClerks' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'planetDeposits' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'planetDistricts' },
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
          name: { kind: 'Name', value: 'planetDistrictsHab' },
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
          name: { kind: 'Name', value: 'planetEnergyThralls' },
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
          name: { kind: 'Name', value: 'planetEntertainers' },
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
          name: { kind: 'Name', value: 'planetJobsProductive' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'planetMaintenanceDrones' },
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
          name: { kind: 'Name', value: 'planetPopAssemblers' },
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
          name: { kind: 'Name', value: 'planetSrMiners' },
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
          name: { kind: 'Name', value: 'popCategoryCivilians' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'popCategoryDrones' },
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
          name: { kind: 'Name', value: 'situations' },
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
          name: { kind: 'Name', value: 'stationObserverMissions' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'stationObservers' },
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
      name: { kind: 'Name', value: 'PlanetProduction' },
      interfaces: [],
      directives: [
        {
          kind: 'Directive',
          name: { kind: 'Name', value: 'cacheControl' },
          arguments: [],
        },
      ],
      fields: [
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'income' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'expenses' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BudgetEntry' },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'balance' },
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
      name: { kind: 'Name', value: 'Coordinate' },
      interfaces: [],
      directives: [
        {
          kind: 'Directive',
          name: { kind: 'Name', value: 'cacheControl' },
          arguments: [],
        },
      ],
      fields: [
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'x' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'y' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'systemId' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          directives: [],
        },
      ],
    },
    {
      kind: 'ObjectTypeDefinition',
      name: { kind: 'Name', value: 'Planet' },
      interfaces: [],
      directives: [
        {
          kind: 'Directive',
          name: { kind: 'Name', value: 'cacheControl' },
          arguments: [],
        },
      ],
      fields: [
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'planetId' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'planetName' },
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
          name: { kind: 'Name', value: 'profits' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'PlanetProduction' },
            },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'coordinate' },
          arguments: [],
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'Coordinate' },
          },
          directives: [],
        },
      ],
    },
    {
      kind: 'ObjectTypeDefinition',
      name: { kind: 'Name', value: 'Empire' },
      interfaces: [],
      directives: [
        {
          kind: 'Directive',
          name: { kind: 'Name', value: 'cacheControl' },
          arguments: [],
        },
      ],
      fields: [
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'countryId' },
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
          name: { kind: 'Name', value: 'isPlayer' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'Boolean' },
            },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'capitalPlanetId' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'ownedPlanetCount' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'ownedPlanetIds' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'ListType',
              type: {
                kind: 'NonNullType',
                type: {
                  kind: 'NamedType',
                  name: { kind: 'Name', value: 'Int' },
                },
              },
            },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'controlledPlanetCount' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'militaryPower' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'economyPower' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'techPower' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } },
          directives: [],
        },
      ],
    },
    {
      kind: 'ObjectTypeDefinition',
      name: { kind: 'Name', value: 'OpinionModifier' },
      interfaces: [],
      directives: [
        {
          kind: 'Directive',
          name: { kind: 'Name', value: 'cacheControl' },
          arguments: [],
        },
      ],
      fields: [
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'modifierType' },
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
          name: { kind: 'Name', value: 'value' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } },
          },
          directives: [],
        },
      ],
    },
    {
      kind: 'ObjectTypeDefinition',
      name: { kind: 'Name', value: 'DiplomaticRelation' },
      interfaces: [],
      directives: [
        {
          kind: 'Directive',
          name: { kind: 'Name', value: 'cacheControl' },
          arguments: [],
        },
      ],
      fields: [
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'targetCountryId' },
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
          name: { kind: 'Name', value: 'targetEmpireName' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'opinion' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'trust' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'threat' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'isHostile' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'Boolean' },
            },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'borderRange' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'hasContact' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'Boolean' },
            },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'hasCommunications' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'Boolean' },
            },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'opinionModifiers' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'ListType',
              type: {
                kind: 'NonNullType',
                type: {
                  kind: 'NamedType',
                  name: { kind: 'Name', value: 'OpinionModifier' },
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
      name: { kind: 'Name', value: 'BudgetTotals' },
      interfaces: [],
      directives: [
        {
          kind: 'Directive',
          name: { kind: 'Name', value: 'cacheControl' },
          arguments: [],
        },
      ],
      fields: [
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'income' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'BudgetEntry' },
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
              name: { kind: 'Name', value: 'BudgetEntry' },
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
              name: { kind: 'Name', value: 'BudgetEntry' },
            },
          },
          directives: [],
        },
      ],
    },
    {
      kind: 'ObjectTypeDefinition',
      name: { kind: 'Name', value: 'Budget' },
      interfaces: [],
      directives: [
        {
          kind: 'Directive',
          name: { kind: 'Name', value: 'cacheControl' },
          arguments: [],
        },
      ],
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
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'totals' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'BudgetTotals' },
            },
          },
          directives: [],
        },
      ],
    },
    {
      kind: 'ObjectTypeDefinition',
      name: { kind: 'Name', value: 'AllPlanetCoordinate' },
      interfaces: [],
      directives: [
        {
          kind: 'Directive',
          name: { kind: 'Name', value: 'cacheControl' },
          arguments: [],
        },
      ],
      fields: [
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'planetId' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'x' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'y' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'systemId' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          directives: [],
        },
      ],
    },
    {
      kind: 'ObjectTypeDefinition',
      name: { kind: 'Name', value: 'Gamestate' },
      interfaces: [],
      directives: [
        {
          kind: 'Directive',
          name: { kind: 'Name', value: 'cacheControl' },
          arguments: [],
        },
      ],
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
          name: { kind: 'Name', value: 'planets' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'ListType',
              type: {
                kind: 'NonNullType',
                type: {
                  kind: 'NamedType',
                  name: { kind: 'Name', value: 'Planet' },
                },
              },
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
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'empires' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'ListType',
              type: {
                kind: 'NonNullType',
                type: {
                  kind: 'NamedType',
                  name: { kind: 'Name', value: 'Empire' },
                },
              },
            },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'playerEmpire' },
          arguments: [],
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Empire' } },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'diplomaticRelations' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'ListType',
              type: {
                kind: 'NonNullType',
                type: {
                  kind: 'NamedType',
                  name: { kind: 'Name', value: 'DiplomaticRelation' },
                },
              },
            },
          },
          directives: [],
        },
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'allPlanetCoordinates' },
          arguments: [],
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'ListType',
              type: {
                kind: 'NonNullType',
                type: {
                  kind: 'NamedType',
                  name: { kind: 'Name', value: 'AllPlanetCoordinate' },
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
      kind: 'ObjectTypeDefinition',
      name: { kind: 'Name', value: 'Subscription' },
      interfaces: [],
      directives: [],
      fields: [
        {
          kind: 'FieldDefinition',
          name: { kind: 'Name', value: 'gamestateCreated' },
          arguments: [
            {
              kind: 'InputValueDefinition',
              name: { kind: 'Name', value: 'saveId' },
              type: {
                kind: 'NonNullType',
                type: {
                  kind: 'NamedType',
                  name: { kind: 'Name', value: 'Int' },
                },
              },
              directives: [],
            },
          ],
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'Gamestate' },
            },
          },
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
        {
          kind: 'OperationTypeDefinition',
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'Subscription' },
          },
          operation: 'subscription',
        },
      ],
    },
  ],
} as unknown as DocumentNode
