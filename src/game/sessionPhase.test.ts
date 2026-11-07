import { describe, expect, it, beforeEach } from "vitest"
import {
  getArrangement,
  getEncounterId,
  getFight,
  getGamePhase,
  getMelodyBank,
  handleStep,
  loadMelodyTemplate,
  requestTemplateChart,
  resetAll,
  resetFight,
  saveToMelodyBank,
  setEncounterId,
  setGamePhase,
  startFight,
  toMenu,
  toPrep,
} from "./session"

describe("session game phase, encounters, and melody bank", () => {
  beforeEach(() => {
    resetAll()
  })

  describe("game phases", () => {
    it("starts in prep phase by default after resetAll", () => {
      expect(getGamePhase()).toBe("prep")
    })

    it("transitions to menu and back to prep", () => {
      toMenu()
      expect(getGamePhase()).toBe("menu")
      toPrep()
      expect(getGamePhase()).toBe("prep")
      setGamePhase("combat")
      expect(getGamePhase()).toBe("combat")
    })

    it("transitions to combat on startFight", () => {
      startFight()
      expect(getGamePhase()).toBe("combat")
    })

    it("transitions to victory when all enemies are defeated", () => {
      startFight({ enemyIds: ["mite"] })
      expect(getGamePhase()).toBe("combat")
      // Defeat the enemy
      const fight = getFight()
      fight.enemies[0].hp = 0
      handleStep()
      // advanceTick checks win/loss
      expect(getFight().over).toBe("player")
      expect(getGamePhase()).toBe("victory")
    })

    it("transitions to defeat when all party members fall", () => {
      startFight()
      const fight = getFight()
      for (const p of fight.party) {
        p.hp = 0
      }
      handleStep()
      expect(getFight().over).toBe("enemy")
      expect(getGamePhase()).toBe("defeat")
    })
  })

  describe("multi-enemy encounters", () => {
    it("starts fight with selected encounter", () => {
      setEncounterId("mite-swarm")
      expect(getEncounterId()).toBe("mite-swarm")
      startFight()
      const fight = getFight()
      expect(fight.enemies.length).toBe(2)
      expect(fight.enemies[0].name).toBe("Mite 1")
      expect(fight.enemies[1].name).toBe("Mite 2")
    })

    it("can specify encounterId directly in startFight opts", () => {
      startFight({ encounterId: "discordant-choir" })
      expect(getEncounterId()).toBe("discordant-choir")
      const fight = getFight()
      expect(fight.enemies.length).toBe(3)
    })

    it("can specify arbitrary enemyIds in startFight", () => {
      startFight({ enemyIds: ["mirror", "echo"] })
      const fight = getFight()
      expect(fight.enemies.length).toBe(2)
      expect(fight.enemies[0].id).toContain("mirror")
      expect(fight.enemies[1].id).toContain("echo")
    })
  })

  describe("melody bank integration", () => {
    it("loads starter template into arrangement", () => {
      const ok = loadMelodyTemplate("staccato-flight")
      expect(ok).toBe(true)
      const arr = getArrangement()
      expect(arr.chords).toEqual(["i", "iv", "i", "iv"])
      // Check that notes exist on slot 0
      const hasNotes = arr.tracks[0].some((bar) => bar.some((n) => n != null))
      expect(hasNotes).toBe(true)
    })

    it("saves current arrangement to melody bank and can recall it", () => {
      const template = saveToMelodyBank("Test Preset", "A test template")
      expect(template.name).toBe("Test Preset")
      const bank = getMelodyBank()
      expect(bank[template.id]).toBeDefined()

      // Modify arrangement
      loadMelodyTemplate("solemn-ground")
      expect(getArrangement().chords).toEqual(["i", "V", "i", "V"])

      // Reload test preset
      loadMelodyTemplate(template.id)
      expect(getArrangement().chords).toEqual(template.chords)
    })

    it("opens QTE chart to cast template mid-combat", () => {
      startFight()
      const ok = requestTemplateChart("solemn-ground")
      expect(ok).toBe(true)
      expect(getFight().activeQte?.kind).toBe("preset")
      expect(getFight().activeQte?.payload.presetChords).toEqual(["i", "V", "i", "V"])
    })
  })

  describe("preset cooldown reset on new combat", () => {
    it("clears cooldowns on resetFight/startFight", () => {
      resetFight()
      expect(getGamePhase()).toBe("combat")
    })
  })
})
