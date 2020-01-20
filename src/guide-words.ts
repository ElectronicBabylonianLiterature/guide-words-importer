import * as _ from 'lodash'

export interface GuideWords {
  lemma: string;
  eblHomonym: string;
  eblGuideWord: string;
  oraccLemma: string;
  oraccGuideWord: string;
}

const hasSameLemmaAndHomonym = (guideWord: GuideWords) => (candidate: GuideWords): boolean =>
  candidate.lemma === guideWord.lemma && candidate.eblHomonym === guideWord.eblHomonym

const countMatchingGuideWords = (guideWord: GuideWords, guideWords: readonly GuideWords[]): number =>
  _(guideWords)
  .filter(hasSameLemmaAndHomonym(guideWord))
  .uniqBy('eblGuideWord')
  .size()

export function isValidIn(guideWords: readonly GuideWords[]) {
  return (guideWord: GuideWords) => {
    const hasEblProperties = guideWord.lemma && guideWord.eblHomonym && guideWord.eblGuideWord
    const isUnique = countMatchingGuideWords(guideWord, guideWords) === 1
    return hasEblProperties && isUnique
  }
}
