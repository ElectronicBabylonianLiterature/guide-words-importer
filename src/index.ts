import {Command, flags} from '@oclif/command'
import cli from 'cli-ux'
import * as _ from 'lodash'
import {setGuideWords} from './fragment-repository'
import {parseFromFile} from './guide-word-parser'
import {GuideWords} from './guide-words'

class GuideWordsImporter extends Command {
  static description = 'Imports guide words from a CSV file to MongoDB.'

  static flags = {
    version: flags.version({char: 'v'}),
    help: flags.help({char: 'h'}),
    host: flags.string({char: 'h', description: 'MongoDB URI', default: 'mongodb://localhost:27017'}),
  }

  static args = [{name: 'file', description: 'Path to the CSV file', required: true}]

  async run() {
    const {args: {file}, flags: {host}} = this.parse(GuideWordsImporter)

    try {
      cli.action.start(`Loading guide words from ${file}...`)
      const [guideWords] = await this.loadGuideWords(file)
      cli.action.stop()

      cli.action.start(`Updating guide words to MongoDB ${host}...`)
      await setGuideWords(host, guideWords)
      cli.action.stop()
    } catch (error) {
      this.error(error)
    }
  }

  private async loadGuideWords(file: string): Promise<readonly [readonly GuideWords[], readonly GuideWords[]]> {
    const hasSameLemmaAndHomonym = (guideWord: GuideWords) => (candidate: GuideWords): boolean =>
      candidate.lemma === guideWord.lemma && candidate.eblHomonym === guideWord.eblHomonym

    const countMatchingGuideWords = (guideWord: GuideWords, guideWords: readonly GuideWords[]): number =>
      _(guideWords)
      .filter(hasSameLemmaAndHomonym(guideWord))
      .uniqBy('eblGuideWord')
      .size()

    const guideWordIsUniqueIn = (guideWords: readonly GuideWords[]) => (guideWord: GuideWords) =>
      countMatchingGuideWords(guideWord, guideWords) === 1

    return parseFromFile(file).then(guideWords => _.partition(guideWords, guideWordIsUniqueIn(guideWords)))
  }
}

export = GuideWordsImporter
