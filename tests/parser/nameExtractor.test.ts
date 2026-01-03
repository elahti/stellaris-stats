import { describe, expect, it } from 'bun:test'
import {
  extractDisplayName,
  extractPlanetName,
} from '../../src/parser/nameExtractor.js'

describe('Name Extractor', () => {
  describe('extractDisplayName', () => {
    it('extracts simple name format', () => {
      const name = extractDisplayName({ key: 'Human Empire' })
      expect(name).toBe('Human Empire')
    })

    it('extracts template name format with variables', () => {
      const name = extractDisplayName({
        key: '%ADJECTIVE%',
        variables: [
          { key: '1', value: { key: 'Galactic' } },
          { key: '2', value: { key: 'Federation' } },
        ],
      })
      expect(name).toBe('Galactic Federation')
    })

    it('strips EMPIRE_DESIGN_ prefix', () => {
      const name = extractDisplayName({ key: 'EMPIRE_DESIGN_humans2' })
      expect(name).toBe('humans2')
    })

    it('strips NAME_ prefix', () => {
      const name = extractDisplayName({ key: 'NAME_Sol' })
      expect(name).toBe('Sol')
    })

    it('strips SPEC_ prefix', () => {
      const name = extractDisplayName({ key: 'SPEC_Human' })
      expect(name).toBe('Human')
    })

    it('handles empty name object', () => {
      const name = extractDisplayName({})
      expect(name).toBe('Unknown')
    })

    it('handles null input', () => {
      const name = extractDisplayName(null)
      expect(name).toBe('Unknown')
    })

    it('handles undefined input', () => {
      const name = extractDisplayName(undefined)
      expect(name).toBe('Unknown')
    })

    it('handles string input', () => {
      const name = extractDisplayName('Simple String')
      expect(name).toBe('Simple String')
    })

    it('replaces underscores with spaces', () => {
      const name = extractDisplayName({ key: 'United_Nations_of_Earth' })
      expect(name).toBe('United Nations of Earth')
    })
  })

  describe('extractPlanetName', () => {
    it('extracts simple planet name', () => {
      const name = extractPlanetName({ key: 'Earth' })
      expect(name).toBe('Earth')
    })

    it('strips MAM1_PLANET_ prefix', () => {
      const name = extractPlanetName({ key: 'MAM1_PLANET_Sol' })
      expect(name).toBe('Sol')
    })

    it('strips MAM2_PLANET_ prefix', () => {
      const name = extractPlanetName({ key: 'MAM2_PLANET_Mars' })
      expect(name).toBe('Mars')
    })

    it('strips NEW_COLONY_NAME_ prefix', () => {
      const name = extractPlanetName({ key: 'NEW_COLONY_NAME_Prime' })
      expect(name).toBe('Prime')
    })

    it('strips NAME_ prefix', () => {
      const name = extractPlanetName({ key: 'NAME_Earth' })
      expect(name).toBe('Earth')
    })

    it('handles PLANET_NAME_FORMAT special case', () => {
      const name = extractPlanetName({
        key: 'PLANET_NAME_FORMAT',
        variables: [
          { key: '1', value: { key: 'Alpha' } },
          { key: '2', value: { key: 'Centauri' } },
        ],
      })
      expect(name).toBe('Alpha Centauri')
    })

    it('handles null input', () => {
      const name = extractPlanetName(null)
      expect(name).toBe('Unknown')
    })

    it('handles string input', () => {
      const name = extractPlanetName('Simple Planet')
      expect(name).toBe('Simple Planet')
    })

    it('replaces underscores with spaces', () => {
      const name = extractPlanetName({ key: 'Alpha_Centauri_Prime' })
      expect(name).toBe('Alpha Centauri Prime')
    })
  })
})
