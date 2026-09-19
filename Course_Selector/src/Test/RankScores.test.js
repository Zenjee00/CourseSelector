import {
  describe,
  expect,
  it,
} from 'vitest';

const rankScores = (scores = {}) =>
  Object.entries(scores).sort(
    ([, leftScore], [, rightScore]) => rightScore - leftScore
  )

describe('quiz score ranking', () => {
  it('places the highest, second-highest, and third-highest scores first', () => {
    const scores = {
      'BUSINESS / FINANCE / MANAGEMENT': 11.004,
      'HOSPITALITY / TOURISM': 14.001,
      'AGRICULTURE / ENVIRONMENT': 13.001,
      'ARTS / DESIGN / MEDIA': 12.002,
    }

    const rankedScores = rankScores(scores)

    expect(rankedScores[0]).toEqual([
      'HOSPITALITY / TOURISM',
      14.001,
    ])

    expect(rankedScores[1]).toEqual([
      'AGRICULTURE / ENVIRONMENT',
      13.001,
    ])

    expect(rankedScores[2]).toEqual([
      'ARTS / DESIGN / MEDIA',
      12.002,
    ])
  })

  it('keeps every category in the result', () => {
    const scores = {
      Computer: 15,
      Business: 12,
      Education: 9,
    }

    expect(rankScores(scores)).toHaveLength(3)
  })

  it('returns an empty array when there are no scores', () => {
    expect(rankScores()).toEqual([])
  })
})